using System;

namespace EMR.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string?  Username { get; set; }
        public string?  DisplayName { get; set; }
        public string?  Position { get; set; }
        public string?  EmployeeCode { get; set; }
        public string?  Email { get; set; }
        public string?  PasswordHash { get; set; }
        public int? RoleId { get; set; }
        public int? DepartmentId { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsActive { get; set; }
    }
}