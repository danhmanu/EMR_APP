using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EMR.Domain.Interfaces;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;

namespace EMR.Infrastructure
{
    /// <summary>
    /// Authentication service providing password hashing and JWT token generation.
    /// Requires JWT key to be provided via dependency injection for secure token generation.
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly string _jwtKey;
        private readonly int _tokenExpiryHours;

        public AuthService(string jwtKey, int tokenExpiryHours = 8)
        {
            if (string.IsNullOrEmpty(jwtKey))
                throw new ArgumentNullException(nameof(jwtKey), "JWT key cannot be null or empty");
            if (jwtKey.Length < 32)
                throw new ArgumentException("JWT key must be at least 32 characters long", nameof(jwtKey));

            _jwtKey = jwtKey;
            _tokenExpiryHours = tokenExpiryHours;
        }

        /// <summary>
        /// Hashes a plain text password using BCrypt with secure salt.
        /// </summary>
        public string HashPassword(string plain)
        {
            if (string.IsNullOrEmpty(plain))
                throw new ArgumentNullException(nameof(plain), "Password cannot be null or empty");
            return BCrypt.Net.BCrypt.HashPassword(plain, BCrypt.Net.BCrypt.GenerateSalt(12));
        }

        /// <summary>
        /// Verifies a plain text password against a BCrypt hash.
        /// Only BCrypt hashes are supported; plaintext password storage is not allowed.
        /// </summary>
        public bool VerifyPassword(string plain, string hash)
        {
            if (string.IsNullOrEmpty(plain) || string.IsNullOrEmpty(hash))
                return false;
            try
            {
                return BCrypt.Net.BCrypt.Verify(plain, hash);
            }
            catch (SaltParseException)
            {
                // Hash is not a valid BCrypt hash (e.g., plaintext password)
                return false;
            }
        }

        /// <summary>
        /// Generates a JWT token for authenticated user.
        /// Token includes userId, username, and optional role claim.
        /// </summary>
        public string GenerateToken(int userId, string username, string? role = null)
        {
            if (string.IsNullOrEmpty(username))
                throw new ArgumentNullException(nameof(username), "Username cannot be null or empty");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claimsList = new System.Collections.Generic.List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim("username", username)
            };
            if (!string.IsNullOrEmpty(role))
                claimsList.Add(new Claim("role", role));

            var token = new JwtSecurityToken(
                issuer: "EMR",
                audience: "EMR",
                claims: claimsList,
                expires: DateTime.UtcNow.AddHours(_tokenExpiryHours),
                signingCredentials: creds
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    /// <summary>
    /// Static helper for password operations in seed data and other static contexts.
    /// Use IAuthService for dependency-injected contexts.
    /// </summary>
    public static class PasswordHelper
    {
        /// <summary>
        /// Hashes a plain text password using BCrypt. Safe for use in static contexts like SeedData.
        /// </summary>
        public static string HashPassword(string plain)
        {
            if (string.IsNullOrEmpty(plain))
                throw new ArgumentNullException(nameof(plain), "Password cannot be null or empty");
            return BCrypt.Net.BCrypt.HashPassword(plain, BCrypt.Net.BCrypt.GenerateSalt(12));
        }
    }
}