using System;

namespace EMR.Domain.Exceptions
{
    /// <summary>
    /// Base exception for all domain-specific errors.
    /// Used when business rules or constraints are violated.
    /// </summary>
    public class DomainException : Exception
    {
        public string Code { get; }
        public int HttpStatusCode { get; set; } = 400;

        public DomainException(string message, string? code = null, int httpStatusCode = 400)
            : base(message)
        {
            Code = code ?? this.GetType().Name;
            HttpStatusCode = httpStatusCode;
        }
    }

    /// <summary>
    /// Exception thrown when a required entity is not found.
    /// </summary>
    public class EntityNotFoundException : DomainException
    {
        public EntityNotFoundException(string entityName, object key)
            : base($"{entityName} with identifier {key} was not found.", "ENTITY_NOT_FOUND", 404)
        {
        }
    }

    /// <summary>
    /// Exception thrown when an operation violates a business rule.
    /// </summary>
    public class BusinessRuleException : DomainException
    {
        public BusinessRuleException(string message, string? code = null)
            : base(message, code ?? "BUSINESS_RULE_VIOLATION", 400)
        {
        }
    }

    /// <summary>
    /// Exception thrown when validation fails.
    /// </summary>
    public class ValidationException : DomainException
    {
        public ValidationException(string message, string? code = null)
            : base(message, code ?? "VALIDATION_FAILED", 422)
        {
        }
    }

    /// <summary>
    /// Exception thrown when an operation cannot be performed due to current state.
    /// </summary>
    public class InvalidOperationException : DomainException
    {
        public InvalidOperationException(string message, string? code = null)
            : base(message, code ?? "INVALID_OPERATION", 400)
        {
        }
    }

    /// <summary>
    /// Exception thrown when authentication fails.
    /// </summary>
    public class AuthenticationException : DomainException
    {
        public AuthenticationException(string message = "Authentication failed.", string? code = null)
            : base(message, code ?? "AUTHENTICATION_FAILED", 401)
        {
        }
    }

    /// <summary>
    /// Exception thrown when authorization fails.
    /// </summary>
    public class AuthorizationException : DomainException
    {
        public AuthorizationException(string message = "You do not have permission to perform this operation.", string? code = null)
            : base(message, code ?? "AUTHORIZATION_FAILED", 403)
        {
        }
    }

    /// <summary>
    /// Exception thrown when a resource already exists.
    /// </summary>
    public class DuplicateException : DomainException
    {
        public DuplicateException(string message, string? code = null)
            : base(message, code ?? "DUPLICATE_RESOURCE", 409)
        {
        }
    }

    /// <summary>
    /// Exception thrown when a conflict occurs (e.g., concurrent modification).
    /// </summary>
    public class ConflictException : DomainException
    {
        public ConflictException(string message, string? code = null)
            : base(message, code ?? "CONFLICT", 409)
        {
        }
    }

    /// <summary>
    /// Exception thrown when an ItemCatalog cannot be deleted because it is still in use by devices or tools.
    /// </summary>
    public class ItemCatalogInUseException : DomainException
    {
        public int ActiveDeviceCount { get; }
        public int ActiveToolCount { get; }

        public ItemCatalogInUseException(int activeDeviceCount, int activeToolCount)
            : base("Danh mục đang được sử dụng, không thể xóa.", "ITEM_CATALOG_IN_USE", 409)
        {
            ActiveDeviceCount = activeDeviceCount;
            ActiveToolCount = activeToolCount;
        }
    }
}
