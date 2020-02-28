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
                    if (TraceIdName.Equals(entry.Key, StringComparison.OrdinalIgnoreCase))
                    {
                        traceId = ParseTraceId(entry.Value);
                        OriginalTraceId = entry.Value;
                    }
                    else if (SpanIdName.Equals(entry.Key, StringComparison.OrdinalIgnoreCase))
                    {
                        spanId = Convert.ToUInt64(entry.Value, 16);
                    }
                }

                if (traceId.HasValue && spanId.HasValue)
                {
                    return new SpanContext(traceId.Value, spanId.Value, originalTraceId: OriginalTraceId);
                }
            }

            return null;
        }

        private static ulong ParseTraceId(string str)
        {
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
