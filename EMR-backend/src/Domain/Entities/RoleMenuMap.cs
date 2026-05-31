using System;

namespace EMR.Domain.Entities
{
    public class RoleMenuMap
    {
        public int Id { get; set; }
        public int RoleId { get; set; }
        public int MenuItemId { get; set; }

        // Navigation properties
        public virtual Role? Role { get; set; }
        public virtual MenuItem? MenuItem { get; set; }
    }
}
