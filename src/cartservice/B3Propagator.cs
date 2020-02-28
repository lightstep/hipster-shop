using System;
using LightStep;
using LightStep.Propagation;
using OpenTracing.Propagation;

namespace CartService.Propagation
{
    /// <inheritdoc />
    public class B3Propagator : IPropagator
    {
        public const string TraceIdName = "X-B3-TraceId";
        public const string SpanIdName = "X-B3-SpanId";
        public const string SampledName = "X-B3-Sampled";

        /// <inheritdoc />
        public void Inject<TCarrier>(SpanContext context, IFormat<TCarrier> format, TCarrier carrier)
        {
            if (carrier is ITextMap text)
            {
                text.Set(TraceIdName, context.OriginalTraceId);
                text.Set(SpanIdName, context.SpanId);
                text.Set(SampledName, "1");
            }
        }

        /// <inheritdoc />
        public SpanContext Extract<TCarrier>(IFormat<TCarrier> format, TCarrier carrier)
        {
            if (carrier is ITextMap text)
            {
                ulong? traceId = null;
                string OriginalTraceId = null;
                ulong? spanId = null;

                foreach (var entry in text)
                {
					Console.WriteLine($"{entry.Key}={entry.Value}");
					try
					{
						if (TraceIdName.Equals(entry.Key, StringComparison.OrdinalIgnoreCase))
						{
							traceId = ParseTraceId(entry.Value);
							OriginalTraceId = entry.Value;
						}
						else if (SpanIdName.Equals(entry.Key, StringComparison.OrdinalIgnoreCase))
						{
							Console.WriteLine($"Attempting to parse SpanId: {entry.Value}");
							spanId = Convert.ToUInt64(entry.Value, 16);
						}
					}
					catch (Exception e)
					{
						Console.WriteLine($"Error processing header: {entry}\n{e}");
					}
                }

                if (traceId.HasValue && spanId.HasValue)
                {
					Console.WriteLine($"created span context: TraceId={traceId.Value} SpanId={spanId.Value} OrigTraceId={OriginalTraceId}");
                    return new SpanContext(traceId.Value, spanId.Value, originalTraceId: OriginalTraceId);
                }
            }

            return null;
        }

        private static ulong ParseTraceId(string str)
        {
			Console.WriteLine($"Attempting to parse trace ID: {str}");
            ulong traceId;

            if (ContainsHexChar(str))
            {
                if (str.Length <= 16)
                {
                    traceId = Convert.ToUInt64(str, 16);
                }
                else
                {
                    traceId = Convert.ToUInt64(str.Substring(str.Length - 16), 16);
                }
            }
            else
            {
                if (str.Length <= 20)
                {
                    traceId = Convert.ToUInt64(str);
                }
                else
                {
                    traceId = Convert.ToUInt64(str.Substring(str.Length - 20));
                }
            }

			Console.WriteLine($"TraceID: {traceId}");
            return traceId;
        }

        private static bool ContainsHexChar(string traceId)
        {
            foreach (var c in traceId)
            {
                if (char.IsLetter(c))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
