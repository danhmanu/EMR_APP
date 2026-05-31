using System;

namespace EMR.Domain.Entities
{
    public class Department
    {
        public int Id { get; set; }
        public string?  Code { get; set; }
        public string?  Name { get; set; }
        public bool IsDeleted { get; set; }
    }
}