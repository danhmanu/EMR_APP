using EMR.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EMR.Infrastructure
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<RoleMenuMap> RoleMenuMaps { get; set; }
        public DbSet<PermissionItem> PermissionItems { get; set; }
        public DbSet<PermissionRoleMap> PermissionRoleMaps { get; set; }
        public DbSet<SystemConfiguration> SystemConfigurations { get; set; }
        public DbSet<SysApi> SysApis { get; set; }
        public DbSet<EmrPrintTemplate> EmrPrintTemplates { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Role>()
                .HasIndex(r => r.Code)
                .IsUnique();

            modelBuilder.Entity<MenuItem>()
                .HasOne(m => m.ParentMenuItem)
                .WithMany(m => m.ChildMenuItems)
                .HasForeignKey(m => m.ParentMenuItemId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MenuItem>()
                .HasIndex(m => m.Key)
                .IsUnique();

            modelBuilder.Entity<MenuItem>()
                .HasIndex(m => m.DisplayOrder);

            modelBuilder.Entity<RoleMenuMap>()
                .HasOne(rm => rm.Role)
                .WithMany()
                .HasForeignKey(rm => rm.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RoleMenuMap>()
                .HasOne(rm => rm.MenuItem)
                .WithMany(m => m.RoleMenuMaps)
                .HasForeignKey(rm => rm.MenuItemId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RoleMenuMap>()
                .HasIndex(rm => new { rm.RoleId, rm.MenuItemId })
                .IsUnique();

            modelBuilder.Entity<PermissionItem>()
                .HasIndex(p => p.Code)
                .IsUnique();

            modelBuilder.Entity<PermissionRoleMap>()
                .HasOne(pm => pm.Role)
                .WithMany()
                .HasForeignKey(pm => pm.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PermissionRoleMap>()
                .HasOne(pm => pm.PermissionItem)
                .WithMany()
                .HasForeignKey(pm => pm.PermissionItemId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PermissionRoleMap>()
                .HasIndex(pm => new { pm.RoleId, pm.PermissionItemId })
                .IsUnique();

            modelBuilder.Entity<SystemConfiguration>()
                .HasIndex(x => x.Code)
                .IsUnique();

            modelBuilder.Entity<SystemConfiguration>()
                .Property(x => x.Code)
                .HasMaxLength(100)
                .IsRequired();

            modelBuilder.Entity<SystemConfiguration>()
                .Property(x => x.Description)
                .HasMaxLength(500);

            modelBuilder.Entity<SysApi>(entity =>
            {
                entity.ToTable("sysapi");
                entity.HasIndex(x => x.Code).IsUnique();
                entity.Property(x => x.Code).HasMaxLength(100).IsRequired();
                entity.Property(x => x.Extend).HasMaxLength(500).IsRequired();
                entity.Property(x => x.Method).HasMaxLength(20).IsRequired();
            });

            modelBuilder.Entity<EmrPrintTemplate>(entity =>
            {
                entity.ToTable("emr_print_templates");
                entity.HasIndex(x => x.Code).IsUnique();
                entity.Property(x => x.Code).HasMaxLength(100).IsRequired();
                entity.Property(x => x.Name).HasMaxLength(250).IsRequired();
                entity.Property(x => x.Description).HasMaxLength(500);
                entity.Property(x => x.TemplateGroup).HasMaxLength(100).IsRequired();
                entity.Property(x => x.PaperSize).HasMaxLength(20).IsRequired();
                entity.Property(x => x.Orientation).HasMaxLength(20).IsRequired();
                entity.Property(x => x.LayoutJson).HasColumnType("longtext").IsRequired();
                entity.Property(x => x.SampleDataJson).HasColumnType("longtext");
            });
        }
    }
}
