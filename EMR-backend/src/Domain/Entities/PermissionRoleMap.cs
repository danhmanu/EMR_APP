namespace EMR.Domain.Entities
{
    public class PermissionRoleMap
    {
        public int Id { get; set; }
        public int RoleId { get; set; }
        public int PermissionItemId { get; set; }

        public virtual Role? Role { get; set; }
        public virtual PermissionItem? PermissionItem { get; set; }
    }
}
