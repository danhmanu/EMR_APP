using System;
using System.Net.Mail;
using EMR.Domain.Exceptions;

namespace EMR.Application.Services
{
    internal static class AdminValidationHelpers
    {
        public static string RequireTrimmed(string? value, string fieldName)
        {
            var trimmed = value?.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                throw new ValidationException(fieldName + " is required");
            return trimmed;
        }

        public static string? TrimOrNull(string? value)
        {
            var trimmed = value?.Trim();
            return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
        }

        public static void ValidateEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return;

            try
            {
                _ = new MailAddress(email);
            }
            catch (FormatException)
            {
                throw new ValidationException("Email is invalid");
            }
        }
    }
}
