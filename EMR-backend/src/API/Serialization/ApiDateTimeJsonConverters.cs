using System;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace EMR.Api.Serialization
{
    public static class ApiDateTimeFormat
    {
        public const string DateTime = "yyyy-MM-dd HH:mm:ss";
    }

    public sealed class ApiDateTimeJsonConverter : JsonConverter<DateTime>
    {
        private static readonly TimeZoneInfo VietNamTimeZone = ResolveVietNamTimeZone();
        private static readonly string[] LocalFormats =
        {
            ApiDateTimeFormat.DateTime,
            "yyyy-MM-dd",
            "yyyy-MM-ddTHH:mm:ss",
            "yyyy-MM-ddTHH:mm:ss.fff",
            "yyyy-MM-ddTHH:mm:ss.fffffff"
        };

        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType != JsonTokenType.String)
                throw new JsonException("DateTime value must be a string.");

            var raw = reader.GetString();
            if (string.IsNullOrWhiteSpace(raw))
                throw new JsonException("DateTime value cannot be empty.");

            raw = raw.Trim();

            if (DateTime.TryParseExact(raw, LocalFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedLocal))
            {
                return DateTime.SpecifyKind(parsedLocal, DateTimeKind.Unspecified);
            }

            if (DateTimeOffset.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces | DateTimeStyles.AssumeUniversal, out var dto))
            {
                var vnTime = TimeZoneInfo.ConvertTime(dto, VietNamTimeZone);
                return DateTime.SpecifyKind(vnTime.DateTime, DateTimeKind.Unspecified);
            }

            if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces, out var parsed))
            {
                if (parsed.Kind == DateTimeKind.Utc)
                {
                    var vnTime = TimeZoneInfo.ConvertTimeFromUtc(parsed, VietNamTimeZone);
                    return DateTime.SpecifyKind(vnTime, DateTimeKind.Unspecified);
                }

                return DateTime.SpecifyKind(parsed, DateTimeKind.Unspecified);
            }

            throw new JsonException($"Invalid DateTime value: '{raw}'.");
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            var normalized = value.Kind == DateTimeKind.Utc
                ? DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeFromUtc(value, VietNamTimeZone), DateTimeKind.Unspecified)
                : value;

            writer.WriteStringValue(normalized.ToString(ApiDateTimeFormat.DateTime, CultureInfo.InvariantCulture));
        }

        private static TimeZoneInfo ResolveVietNamTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                }
                catch (TimeZoneNotFoundException)
                {
                    return TimeZoneInfo.Local;
                }
            }
        }
    }

    public sealed class ApiNullableDateTimeJsonConverter : JsonConverter<DateTime?>
    {
        private readonly ApiDateTimeJsonConverter _inner = new();

        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return null;

            return _inner.Read(ref reader, typeof(DateTime), options);
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (!value.HasValue)
            {
                writer.WriteNullValue();
                return;
            }

            _inner.Write(writer, value.Value, options);
        }
    }
}
