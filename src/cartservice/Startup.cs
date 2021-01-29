using System;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using cartservice.cartstore;
using cartservice.services;
using OpenTelemetry;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using OpenTelemetry.Context.Propagation;
using Grpc.Core;

namespace cartservice
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }
        const string LIGHTSTEP_ACCESS_TOKEN = "LS_ACCESS_TOKEN";
        const string LIGHTSTEP_HOST = "LIGHTSTEP_HOST";
        const string LIGHTSTEP_PORT = "LIGHTSTEP_PORT";
        public IConfiguration Configuration { get; }
        
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {

            AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);

            string lsHost = Environment.GetEnvironmentVariable(LIGHTSTEP_HOST);
            int lsPort = Int32.Parse(Environment.GetEnvironmentVariable(LIGHTSTEP_PORT));
            string serviceName = Environment.GetEnvironmentVariable("LS_SERVICE_NAME");
            string accessToken = Environment.GetEnvironmentVariable(LIGHTSTEP_ACCESS_TOKEN);
            // create and register an activity source
            var activitySource = new ActivitySource(serviceName);
            services.AddSingleton(activitySource);

            // from: https://github.com/kellybirr/tracing-demo
            OpenTelemetry.Sdk.SetDefaultTextMapPropagator(new B3Propagator());

            string redisAddress = Configuration["REDIS_ADDR"];
            ICartStore cartStore = null;
            if (!string.IsNullOrEmpty(redisAddress))
            {
                cartStore = new RedisCartStore(redisAddress);
            }
            else
            {
                Console.WriteLine("Redis cache host(hostname+port) was not specified. Starting a cart service using local store");
                Console.WriteLine("If you wanted to use Redis Cache as a backup store, you should provide its address via command line or REDIS_ADDR environment variable.");
                cartStore = new LocalCartStore();
            }

            services.AddOpenTelemetryTracing((builder) => builder
                .AddSource(activitySource.Name)
                .AddAspNetCoreInstrumentation(opt =>
                {
                    opt.EnableGrpcAspNetCoreSupport = true;
                })
                .AddHttpClientInstrumentation()
                .AddGrpcClientInstrumentation()
                .AddConsoleExporter()
                .AddRedisInstrumentation(cartStore.Connection)
                .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService(serviceName))
                .AddOtlpExporter(opt => {
                    opt.Endpoint = $"{lsHost}:{lsPort}";
                    opt.Headers = new Metadata
                    {
                        { "lightstep-access-token", accessToken }
                    };
                    opt.Credentials = new SslCredentials();
            }));

            // Initialize the redis store
            cartStore.InitializeAsync().GetAwaiter().GetResult();
            Console.WriteLine("Initialization completed");

            services.AddSingleton<ICartStore>(cartStore);

            services.AddGrpc();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseRouting();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGrpcService<CartService>();
                endpoints.MapGrpcService<cartservice.services.HealthCheckService>();

                endpoints.MapGet("/", async context =>
                {
                    await context.Response.WriteAsync("Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");
                });
            });
        }
    }
}