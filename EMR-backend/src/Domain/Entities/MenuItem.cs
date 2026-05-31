using System;
using System.Collections.Generic;

namespace EMR.Domain.Entities
{
    public class MenuItem
    {
        public int Id { get; set; }
        public string? Key { get; set; }
        public string? Title { get; set; }
        public string? Link { get; set; }
        public string? Icon { get; set; }
        public int DisplayOrder { get; set; }
        public int? ParentMenuItemId { get; set; }
        public bool IsDeleted { get; set; }

        // Navigation properties
        public virtual MenuItem? ParentMenuItem { get; set; }
        public virtual ICollection<MenuItem> ChildMenuItems { get; set; } = new List<MenuItem>();
        public virtual ICollection<RoleMenuMap> RoleMenuMaps { get; set; } = new List<RoleMenuMap>();
    }
}
