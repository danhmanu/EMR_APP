using System;
using System.Collections.Generic;
using System.Linq;
using EMR.Domain.Entities;
using EMR.Domain.Security;
using Microsoft.EntityFrameworkCore;

namespace EMR.Infrastructure
{
    public static class SeedData
    {
        private static void CanonicalizeRoles(AppDbContext db)
        {
            var roles = db.Roles.ToList();
            var groups = roles
                .Select(role => new
                {
                    Role = role,
                    HasCanonical = SystemRoles.TryNormalize(role.Code ?? role.Name, out var canonicalCode),
                    CanonicalName = SystemRoles.ToCode(role.Code ?? role.Name)
                })
                .Where(x => x.HasCanonical)
                .GroupBy(x => x.CanonicalName, StringComparer.OrdinalIgnoreCase)
                .ToList();

            var changed = false;

            foreach (var group in groups)
            {
                var primary = group
                    .OrderByDescending(x => string.Equals(x.Role.Code, group.Key, StringComparison.OrdinalIgnoreCase))
                    .ThenBy(x => x.Role.Id)
                    .First()
                    .Role;

                if (!string.Equals(primary.Code, group.Key, StringComparison.Ordinal) ||
                    !string.Equals(primary.Name, SystemRoles.GetDisplayName(group.Key), StringComparison.Ordinal))
                {
                    primary.Code = group.Key;
                    primary.Name = SystemRoles.GetDisplayName(group.Key);
                    changed = true;
                }

                foreach (var duplicate in group.Select(x => x.Role).Where(role => role.Id != primary.Id))
                {
                    var users = db.Users.Where(user => user.RoleId == duplicate.Id).ToList();
                    foreach (var user in users)
                    {
                        user.RoleId = primary.Id;
                    }

                    if (users.Count > 0)
                    {
                        changed = true;
                    }

                    db.Roles.Remove(duplicate);
                    changed = true;
                }
            }

            if (changed)
            {
                db.SaveChanges();
            }
        }

        public static void EnsureSeed(AppDbContext db)
        {
            var standardizedRoles = SystemRoles.All;

            if (!db.Roles.AnyAsync().Result)
            {
                var adminRole = new Role { Id = 1, Code = SystemRoles.Admin, Name = SystemRoles.GetDisplayName(SystemRoles.Admin) };
                var engineerRole = new Role { Id = 2, Code = SystemRoles.Engineer, Name = SystemRoles.GetDisplayName(SystemRoles.Engineer) };
                var techRole = new Role { Id = 3, Code = SystemRoles.Technician, Name = SystemRoles.GetDisplayName(SystemRoles.Technician) };
                var deptRole = new Role { Id = 4, Code = SystemRoles.DepartmentUser, Name = SystemRoles.GetDisplayName(SystemRoles.DepartmentUser) };
                var accountantRole = new Role { Id = 5, Code = SystemRoles.Accountant, Name = SystemRoles.GetDisplayName(SystemRoles.Accountant) };
                var procurementRole = new Role { Id = 6, Code = SystemRoles.Procurement, Name = SystemRoles.GetDisplayName(SystemRoles.Procurement) };
                db.Roles.AddRange(adminRole, engineerRole, techRole, deptRole, accountantRole, procurementRole);

                db.Users.Add(new User {
                    Id = 1,
                    Username = "admin",
                    DisplayName = "Administrator",
                    Email = "admin@example.local",
                    PasswordHash = PasswordHelper.HashPassword("admin"), // dev seed: password = admin
                    RoleId = adminRole.Id,
                    IsDeleted = false,
                    IsActive = true
                });

                db.SaveChanges();
            }

            CanonicalizeRoles(db);

            var existingRoles = db.Roles.Select(r => r.Code ?? string.Empty).ToList();
            var missingRoles = standardizedRoles
                .Where(role => !existingRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
                .Select(role => new Role { Code = role, Name = SystemRoles.GetDisplayName(role) })
                .ToList();

            if (missingRoles.Count > 0)
            {
                db.Roles.AddRange(missingRoles);
                db.SaveChanges();
            }

            SeedMenuItems(db);
            SeedSystemConfigurations(db);
            SeedPermissionItems(db);
            DisableAssetManagementMenus(db);
        }

        private static void SeedSystemConfigurations(AppDbContext db)
        {
            var seedItems = new[]
            {
                new SystemConfiguration { Code = "UNIT_NAME", Value = null, Description = "Tên don v?/b?nh vi?n qu?n lý h? th?ng" },
                new SystemConfiguration { Code = "UNIT_ADDRESS", Value = null, Description = "Ð?a ch? don v?/b?nh vi?n" },
                new SystemConfiguration { Code = "UNIT_TAX_CODE", Value = null, Description = "Mã s? thu?" },
                new SystemConfiguration { Code = "UNIT_BANK_ACCOUNT", Value = null, Description = "S? tài kho?n" },
                new SystemConfiguration { Code = "UNIT_PHONE", Value = null, Description = "S? di?n tho?i" }
            };

            foreach (var item in seedItems)
            {
                var existing = db.SystemConfigurations.FirstOrDefault(x => x.Code == item.Code);
                if (existing != null)
                    continue;

                db.SystemConfigurations.Add(item);
            }

            db.SaveChanges();
        }

        private static void SeedMenuItems(AppDbContext db)
        {
            if (!db.MenuItems.AnyAsync().Result)
            {
                var menuItems = new[]
                {
                    new MenuItem { Id = 47, Key = "emr", Title = "EMR GIADINH", Link = "/emr", Icon = "FileDoneOutlined", DisplayOrder = 1, ParentMenuItemId = null, IsDeleted = false },
                    new MenuItem { Id = 1, Key = "dashboard", Title = "Dashboard", Link = "/dashboard", Icon = "HomeOutlined", DisplayOrder = 2, ParentMenuItemId = null, IsDeleted = false },
                    new MenuItem { Id = 2, Key = "management", Title = "Qu?n lý tài s?n", Link = null, Icon = "AppstoreOutlined", DisplayOrder = 3, ParentMenuItemId = null, IsDeleted = false },
                    new MenuItem { Id = 3, Key = "devices", Title = "H? so tài s?n c? d?nh", Link = "/devices", Icon = "AppstoreOutlined", DisplayOrder = 1, ParentMenuItemId = 2, IsDeleted = false },
                    new MenuItem { Id = 4, Key = "certificates", Title = "Ch?ng nh?n", Link = "/certificates", Icon = "FileTextOutlined", DisplayOrder = 2, ParentMenuItemId = 2, IsDeleted = false },
                    new MenuItem { Id = 8, Key = "procurement", Title = "Mua s?m", Link = null, Icon = "ShoppingCartOutlined", DisplayOrder = 4, ParentMenuItemId = null, IsDeleted = false },
                    new MenuItem { Id = 9, Key = "orders", Title = "Ðon d?t hàng", Link = "/procurement/orders", Icon = "FileTextOutlined", DisplayOrder = 1, ParentMenuItemId = 8, IsDeleted = false },
                    new MenuItem { Id = 10, Key = "contracts", Title = "H?p d?ng", Link = "/procurement/contracts", Icon = "ProfileOutlined", DisplayOrder = 2, ParentMenuItemId = 8, IsDeleted = false },
                    new MenuItem { Id = 11, Key = "receipts", Title = "Phi?u nh?p kho", Link = "/procurement/receipts", Icon = "DatabaseOutlined", DisplayOrder = 3, ParentMenuItemId = 8, IsDeleted = false },
                    new MenuItem { Id = 12, Key = "allocations", Title = "Phân b? / Bàn giao", Link = "/procurement/allocations", Icon = "ProfileOutlined", DisplayOrder = 4, ParentMenuItemId = 8, IsDeleted = false },
                    new MenuItem { Id = 45, Key = "purchase-invoices", Title = "Hóa don d?u vào", Link = "/procurement/invoices", Icon = "FileDoneOutlined", DisplayOrder = 5, ParentMenuItemId = 8, IsDeleted = false },
                    new MenuItem { Id = 13, Key = "maintenance", Title = "B?o trì", Link = null, Icon = "ToolOutlined", DisplayOrder = 5, ParentMenuItemId = null, IsDeleted = false },
                    new MenuItem { Id = 14, Key = "plans", Title = "K? ho?ch b?o trì", Link = "/maintenance/plans", Icon = "ScheduleOutlined", DisplayOrder = 1, ParentMenuItemId = 13, IsDeleted = false },
                    new MenuItem { Id = 15, Key = "tasks", Title = "Nhi?m v? b?o trì", Link = "/maintenance/tasks", Icon = "UnorderedListOutlined", DisplayOrder = 2, ParentMenuItemId = 13, IsDeleted = false },
                    new MenuItem { Id = 16, Key = "calendar", Title = "L?ch b?o trì", Link = "/maintenance/calendar", Icon = "CalendarOutlined", DisplayOrder = 3, ParentMenuItemId = 13, IsDeleted = false },
                    new MenuItem { Id = 17, Key = "records", Title = "H? so b?o trì", Link = "/maintenance/records", Icon = "ProfileOutlined", DisplayOrder = 4, ParentMenuItemId = 13, IsDeleted = false },
                    new MenuItem { Id = 18, Key = "daily-check", Title = "Daily Check", Link = "/daily-check", Icon = "CheckSquareOutlined", DisplayOrder = 5, ParentMenuItemId = 13, IsDeleted = false },
                    new MenuItem { Id = 19, Key = "checklists", Title = "Checklist master", Link = "/maintenance/checklists", Icon = "DatabaseOutlined", DisplayOrder = 6, ParentMenuItemId = 13, IsDeleted = false },
                    new MenuItem { Id = 20, Key = "repairs", Title = "Báo h?ng & S?a ch?a", Link = null, Icon = "ToolOutlined", DisplayOrder = 6, ParentMenuItemId = null, IsDeleted = false },
                    new MenuItem { Id = 21, Key = "repairs-list", Title = "Danh sách báo h?ng", Link = "/repairs", Icon = "UnorderedListOutlined", DisplayOrder = 1, ParentMenuItemId = 20, IsDeleted = false },
                    new MenuItem { Id = 22, Key = "repairs-create", Title = "T?o phi?u báo h?ng", Link = "/repairs/create", Icon = "ProfileOutlined", DisplayOrder = 2, ParentMenuItemId = 20, IsDeleted = false },
                    new MenuItem { Id = 23, Key = "transfers", Title = "Ði?u chuy?n tài s?n", Link = null, Icon = "SwapOutlined", DisplayOrder = 7, ParentMenuItemId = null, IsDeleted = false },
                    new MenuItem { Id = 24, Key = "transfers-list", Title = "Danh sách phi?u", Link = "/transfers", Icon = "UnorderedListOutlined", DisplayOrder = 1, ParentMenuItemId = 23, IsDeleted = false },
                    new MenuItem { Id = 25, Key = "transfers-create", Title = "T?o phi?u di?u chuy?n", Link = "/transfers/create", Icon = "ProfileOutlined", DisplayOrder = 2, ParentMenuItemId = 23, IsDeleted = false },
                    new MenuItem { Id = 42, Key = "asset-outputs", Title = "Thanh lý / Xu?t tài s?n", Link = null, Icon = "ExportOutlined", DisplayOrder = 8, ParentMenuItemId = null, IsDeleted = false },
                    new MenuItem { Id = 43, Key = "asset-outputs-list", Title = "Danh sách phi?u", Link = "/asset-outputs", Icon = "UnorderedListOutlined", DisplayOrder = 1, ParentMenuItemId = 42, IsDeleted = false },
                    new MenuItem { Id = 44, Key = "asset-outputs-create", Title = "T?o phi?u", Link = "/asset-outputs/create", Icon = "ProfileOutlined", DisplayOrder = 2, ParentMenuItemId = 42, IsDeleted = false },
                    new MenuItem { Id = 26, Key = "documents", Title = "Tài li?u", Link = "/documents", Icon = "FileTextOutlined", DisplayOrder = 8, ParentMenuItemId = null, IsDeleted = false },
                    new MenuItem { Id = 27, Key = "reports", Title = "Báo cáo", Link = "/reports", Icon = "BarChartOutlined", DisplayOrder = 9, ParentMenuItemId = null, IsDeleted = false },
                    new MenuItem { Id = 28, Key = "settings", Title = "Cài d?t", Link = null, Icon = "SettingOutlined", DisplayOrder = 10, ParentMenuItemId = null, IsDeleted = false },
                    new MenuItem { Id = 29, Key = "master-data", Title = "Danh m?c Khoa", Link = "/master-data", Icon = "DatabaseOutlined", DisplayOrder = 1, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 30, Key = "manufacturers", Title = "Danh m?c Hãng", Link = "/manufacturers", Icon = "AppstoreOutlined", DisplayOrder = 2, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 31, Key = "companies", Title = "Danh m?c Công ty", Link = "/companies", Icon = "AppstoreOutlined", DisplayOrder = 3, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 41, Key = "countries", Title = "Danh m?c Qu?c gia", Link = "/countries", Icon = "GlobalOutlined", DisplayOrder = 4, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 32, Key = "device-types", Title = "Danh m?c Lo?i thi?t b?", Link = "/device-types", Icon = "AppstoreOutlined", DisplayOrder = 5, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 33, Key = "item-catalogs", Title = "Danh m?c thi?t b? / CCDC", Link = "/item-catalogs", Icon = "DatabaseOutlined", DisplayOrder = 5, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 39, Key = "toolkit-catalogs", Title = "Danh m?c b? d?ng c?", Link = "/toolkit-catalogs", Icon = "DatabaseOutlined", DisplayOrder = 6, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 40, Key = "unit-catalogs", Title = "Danh m?c don v? tính", Link = "/unit-catalogs", Icon = "DatabaseOutlined", DisplayOrder = 8, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 34, Key = "users", Title = "Ngu?i dùng", Link = "/users", Icon = "UserOutlined", DisplayOrder = 9, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 35, Key = "permissions", Title = "Qu?n lý Permissions", Link = "/admin/permissions", Icon = "SettingOutlined", DisplayOrder = 10, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 36, Key = "menu-config", Title = "C?u hình Menu", Link = "/admin/menu-config", Icon = "UnorderedListOutlined", DisplayOrder = 11, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 46, Key = "system-configuration", Title = "C?u hình h? th?ng", Link = "/system-configuration", Icon = "SettingOutlined", DisplayOrder = 12, ParentMenuItemId = 28, IsDeleted = false },
                    new MenuItem { Id = 38, Key = "alerts", Title = "C?nh báo", Link = "/alerts", Icon = "BellOutlined", DisplayOrder = 11, ParentMenuItemId = null, IsDeleted = false }
                };

                db.MenuItems.AddRange(menuItems);
                db.SaveChanges();

                // Seed RoleMenuMaps: Assign all menu items to Admin role
                var adminRole = db.Roles.FirstOrDefault(r => r.Code == SystemRoles.Admin);
                if (adminRole != null)
                {
                    var roleMenuMaps = menuItems.Select(m => new RoleMenuMap 
                    { 
                        RoleId = adminRole.Id, 
                        MenuItemId = m.Id 
                    }).ToList();

                    db.RoleMenuMaps.AddRange(roleMenuMaps);
                    db.SaveChanges();
                }
            }

            // Backfill for existing databases where this item did not exist in earlier seeds.
            var emrMenu = db.MenuItems.FirstOrDefault(m => m.Key == "emr");
            if (emrMenu == null)
            {
                emrMenu = new MenuItem
                {
                    Key = "emr",
                    Title = "EMR GIADINH",
                    Link = "/emr",
                    Icon = "FileDoneOutlined",
                    DisplayOrder = 1,
                    ParentMenuItemId = null,
                    IsDeleted = false
                };

                db.MenuItems.Add(emrMenu);
                db.SaveChanges();
            }
            else if (emrMenu.Link != "/emr" || emrMenu.Title != "EMR GIADINH" || emrMenu.IsDeleted)
            {
                emrMenu.Title = "EMR GIADINH";
                emrMenu.Link = "/emr";
                emrMenu.Icon = "FileDoneOutlined";
                emrMenu.DisplayOrder = 1;
                emrMenu.ParentMenuItemId = null;
                emrMenu.IsDeleted = false;
                db.SaveChanges();
            }

            var dashboardMenu = db.MenuItems.FirstOrDefault(m => m.Key == "dashboard");
            if (dashboardMenu != null && dashboardMenu.Link == "/")
            {
                dashboardMenu.Link = "/dashboard";
                dashboardMenu.DisplayOrder = Math.Max(dashboardMenu.DisplayOrder, 2);
                db.SaveChanges();
            }

            var menuConfig = db.MenuItems.FirstOrDefault(m => m.Key == "menu-config");
            if (menuConfig == null)
            {
                var settingsMenu = db.MenuItems.FirstOrDefault(m => m.Key == "settings");
                menuConfig = new MenuItem
                {
                    Key = "menu-config",
                    Title = "C?u hình Menu",
                    Link = "/admin/menu-config",
                    Icon = "UnorderedListOutlined",
                    DisplayOrder = 7,
                    ParentMenuItemId = settingsMenu?.Id,
                    IsDeleted = false
                };

                db.MenuItems.Add(menuConfig);
                db.SaveChanges();
            }

            // Backfill: update link for "permissions" menu item to point to new page
            var permMenuItem = db.MenuItems.FirstOrDefault(m => m.Key == "permissions");
            if (permMenuItem != null && permMenuItem.Link == "/permissions")
            {
                permMenuItem.Link = "/admin/permissions";
                db.SaveChanges();
            }

            // Backfill: remove legacy tools management menus after Tool table was merged into Devices.
            var legacyToolMenuKeys = new[] { "tools", "procurement-tools", "tool-transfers", "tool-transfers-list", "tool-transfers-create" };
            var legacyToolMenus = db.MenuItems
                .Where(m => legacyToolMenuKeys.Contains(m.Key))
                .ToList();

            if (legacyToolMenus.Count > 0)
            {
                var legacyToolMenuIds = legacyToolMenus.Select(m => m.Id).ToList();
                var legacyToolTransferMenuIds = legacyToolMenus
                    .Where(m => m.Key == "tool-transfers" || m.Key == "tool-transfers-list" || m.Key == "tool-transfers-create")
                    .Select(m => m.Id)
                    .ToList();

                var roleIdsWithLegacyToolTransfer = db.RoleMenuMaps
                    .Where(rm => legacyToolTransferMenuIds.Contains(rm.MenuItemId))
                    .Select(rm => rm.RoleId)
                    .Distinct()
                    .ToList();

                if (roleIdsWithLegacyToolTransfer.Count > 0)
                {
                    var sharedTransferMenus = db.MenuItems
                        .Where(m => m.Key == "transfers" || m.Key == "transfers-list" || m.Key == "transfers-create")
                        .ToList();

                    var missingMaps = new List<RoleMenuMap>();
                    foreach (var roleId in roleIdsWithLegacyToolTransfer)
                    {
                        foreach (var menu in sharedTransferMenus)
                        {
                            var exists = db.RoleMenuMaps.Any(rm => rm.RoleId == roleId && rm.MenuItemId == menu.Id);
                            if (!exists)
                            {
                                missingMaps.Add(new RoleMenuMap { RoleId = roleId, MenuItemId = menu.Id });
                            }
                        }
                    }

                    if (missingMaps.Count > 0)
                    {
                        db.RoleMenuMaps.AddRange(missingMaps);
                        db.SaveChanges();
                    }
                }

                var roleMaps = db.RoleMenuMaps
                    .Where(rm => legacyToolMenuIds.Contains(rm.MenuItemId))
                    .ToList();

                if (roleMaps.Count > 0)
                {
                    db.RoleMenuMaps.RemoveRange(roleMaps);
                }

                db.MenuItems.RemoveRange(legacyToolMenus);
                db.SaveChanges();
            }

            // Backfill: asset output/liquidation menus for existing databases.
            var assetOutputsMenu = db.MenuItems.FirstOrDefault(m => m.Key == "asset-outputs");
            if (assetOutputsMenu == null)
            {
                assetOutputsMenu = new MenuItem
                {
                    Key = "asset-outputs",
                    Title = "Thanh lý / Xu?t tài s?n",
                    Link = null,
                    Icon = "ExportOutlined",
                    DisplayOrder = 8,
                    ParentMenuItemId = null,
                    IsDeleted = false
                };
                db.MenuItems.Add(assetOutputsMenu);
                db.SaveChanges();
            }

            var assetOutputListMenu = db.MenuItems.FirstOrDefault(m => m.Key == "asset-outputs-list");
            if (assetOutputListMenu == null)
            {
                assetOutputListMenu = new MenuItem
                {
                    Key = "asset-outputs-list",
                    Title = "Danh sách phi?u",
                    Link = "/asset-outputs",
                    Icon = "UnorderedListOutlined",
                    DisplayOrder = 1,
                    ParentMenuItemId = assetOutputsMenu.Id,
                    IsDeleted = false
                };
                db.MenuItems.Add(assetOutputListMenu);
                db.SaveChanges();
            }

            var assetOutputCreateMenu = db.MenuItems.FirstOrDefault(m => m.Key == "asset-outputs-create");
            if (assetOutputCreateMenu == null)
            {
                assetOutputCreateMenu = new MenuItem
                {
                    Key = "asset-outputs-create",
                    Title = "T?o phi?u",
                    Link = "/asset-outputs/create",
                    Icon = "ProfileOutlined",
                    DisplayOrder = 2,
                    ParentMenuItemId = assetOutputsMenu.Id,
                    IsDeleted = false
                };
                db.MenuItems.Add(assetOutputCreateMenu);
                db.SaveChanges();
            }

            var adminRoleForMenu = db.Roles.FirstOrDefault(r => r.Code == SystemRoles.Admin);
            if (adminRoleForMenu != null && !db.RoleMenuMaps.Any(rm => rm.RoleId == adminRoleForMenu.Id && rm.MenuItemId == emrMenu.Id))
            {
                db.RoleMenuMaps.Add(new RoleMenuMap
                {
                    RoleId = adminRoleForMenu.Id,
                    MenuItemId = emrMenu.Id
                });
                db.SaveChanges();
            }

            if (adminRoleForMenu != null && !db.RoleMenuMaps.Any(rm => rm.RoleId == adminRoleForMenu.Id && rm.MenuItemId == menuConfig.Id))
            {
                db.RoleMenuMaps.Add(new RoleMenuMap
                {
                    RoleId = adminRoleForMenu.Id,
                    MenuItemId = menuConfig.Id
                });
                db.SaveChanges();
            }

            var systemConfigurationMenu = db.MenuItems.FirstOrDefault(m => m.Key == "system-configuration");
            if (systemConfigurationMenu == null)
            {
                var settingsMenu = db.MenuItems.FirstOrDefault(m => m.Key == "settings");
                systemConfigurationMenu = new MenuItem
                {
                    Key = "system-configuration",
                    Title = "C?u hình h? th?ng",
                    Link = "/system-configuration",
                    Icon = "SettingOutlined",
                    DisplayOrder = 12,
                    ParentMenuItemId = settingsMenu?.Id,
                    IsDeleted = false
                };
                db.MenuItems.Add(systemConfigurationMenu);
                db.SaveChanges();
            }

            if (adminRoleForMenu != null && systemConfigurationMenu != null && !db.RoleMenuMaps.Any(rm => rm.RoleId == adminRoleForMenu.Id && rm.MenuItemId == systemConfigurationMenu.Id))
            {
                db.RoleMenuMaps.Add(new RoleMenuMap
                {
                    RoleId = adminRoleForMenu.Id,
                    MenuItemId = systemConfigurationMenu.Id
                });
                db.SaveChanges();
            }

            if (adminRoleForMenu != null)
            {
                var assetOutputMenuIds = new[] { assetOutputsMenu.Id, assetOutputListMenu.Id, assetOutputCreateMenu.Id };
                var missingAssetOutputMaps = assetOutputMenuIds
                    .Where(menuId => !db.RoleMenuMaps.Any(rm => rm.RoleId == adminRoleForMenu.Id && rm.MenuItemId == menuId))
                    .Select(menuId => new RoleMenuMap { RoleId = adminRoleForMenu.Id, MenuItemId = menuId })
                    .ToList();
                if (missingAssetOutputMaps.Count > 0)
                {
                    db.RoleMenuMaps.AddRange(missingAssetOutputMaps);
                    db.SaveChanges();
                }
            }

            var itemCatalogMenu = db.MenuItems.FirstOrDefault(m => m.Key == "item-catalogs");
            if (itemCatalogMenu == null)
            {
                var settingsMenu = db.MenuItems.FirstOrDefault(m => m.Key == "settings");
                itemCatalogMenu = new MenuItem
                {
                    Key = "item-catalogs",
                    Title = "Danh m?c tài s?n",
                    Link = "/item-catalogs",
                    Icon = "DatabaseOutlined",
                    DisplayOrder = 5,
                    ParentMenuItemId = settingsMenu?.Id,
                    IsDeleted = false
                };

                db.MenuItems.Add(itemCatalogMenu);
                db.SaveChanges();
            }

            var toolKitCatalogMenu = db.MenuItems.FirstOrDefault(m => m.Key == "toolkit-catalogs");
            if (toolKitCatalogMenu == null)
            {
                var settingsMenu = db.MenuItems.FirstOrDefault(m => m.Key == "settings");
                toolKitCatalogMenu = new MenuItem
                {
                    Key = "toolkit-catalogs",
                    Title = "Danh m?c b? d?ng c?",
                    Link = "/toolkit-catalogs",
                    Icon = "DatabaseOutlined",
                    DisplayOrder = 6,
                    ParentMenuItemId = settingsMenu?.Id,
                    IsDeleted = false
                };

                db.MenuItems.Add(toolKitCatalogMenu);
                db.SaveChanges();
            }

            if (adminRoleForMenu != null && itemCatalogMenu != null && !db.RoleMenuMaps.Any(rm => rm.RoleId == adminRoleForMenu.Id && rm.MenuItemId == itemCatalogMenu.Id))
            {
                db.RoleMenuMaps.Add(new RoleMenuMap
                {
                    RoleId = adminRoleForMenu.Id,
                    MenuItemId = itemCatalogMenu.Id
                });
                db.SaveChanges();
            }

            if (itemCatalogMenu != null && toolKitCatalogMenu != null)
            {
                var sourceRoleIds = db.RoleMenuMaps
                    .Where(rm => rm.MenuItemId == itemCatalogMenu.Id)
                    .Select(rm => rm.RoleId)
                    .Distinct()
                    .ToList();

                var missingToolKitMaps = sourceRoleIds
                    .Where(roleId => !db.RoleMenuMaps.Any(rm => rm.RoleId == roleId && rm.MenuItemId == toolKitCatalogMenu.Id))
                    .Select(roleId => new RoleMenuMap
                    {
                        RoleId = roleId,
                        MenuItemId = toolKitCatalogMenu.Id
                    })
                    .ToList();

                if (missingToolKitMaps.Count > 0)
                {
                    db.RoleMenuMaps.AddRange(missingToolKitMaps);
                    db.SaveChanges();
                }
            }

            var unitCatalogMenu = db.MenuItems.FirstOrDefault(m => m.Key == "unit-catalogs");
            if (unitCatalogMenu == null)
            {
                var settingsMenu = db.MenuItems.FirstOrDefault(m => m.Key == "settings");
                unitCatalogMenu = new MenuItem
                {
                    Key = "unit-catalogs",
                    Title = "Danh m?c don v? tính",
                    Link = "/unit-catalogs",
                    Icon = "DatabaseOutlined",
                    DisplayOrder = 7,
                    ParentMenuItemId = settingsMenu?.Id,
                    IsDeleted = false
                };
                db.MenuItems.Add(unitCatalogMenu);
                db.SaveChanges();
            }

            if (itemCatalogMenu != null && unitCatalogMenu != null)
            {
                var sourceRoleIdsForUnit = db.RoleMenuMaps
                    .Where(rm => rm.MenuItemId == itemCatalogMenu.Id)
                    .Select(rm => rm.RoleId)
                    .Distinct()
                    .ToList();

                var missingUnitMaps = sourceRoleIdsForUnit
                    .Where(roleId => !db.RoleMenuMaps.Any(rm => rm.RoleId == roleId && rm.MenuItemId == unitCatalogMenu.Id))
                    .Select(roleId => new RoleMenuMap
                    {
                        RoleId = roleId,
                        MenuItemId = unitCatalogMenu.Id
                    })
                    .ToList();

                if (missingUnitMaps.Count > 0)
                {
                    db.RoleMenuMaps.AddRange(missingUnitMaps);
                    db.SaveChanges();
                }
            }

            var countriesMenu = db.MenuItems.FirstOrDefault(m => m.Key == "countries");
            if (countriesMenu == null)
            {
                var settingsMenu = db.MenuItems.FirstOrDefault(m => m.Key == "settings");
                countriesMenu = new MenuItem
                {
                    Key = "countries",
                    Title = "Danh m?c Qu?c gia",
                    Link = "/countries",
                    Icon = "GlobalOutlined",
                    DisplayOrder = 4,
                    ParentMenuItemId = settingsMenu?.Id,
                    IsDeleted = false
                };
                db.MenuItems.Add(countriesMenu);
                db.SaveChanges();
            }

            var manufacturersMenuForCountries = db.MenuItems.FirstOrDefault(m => m.Key == "manufacturers");
            if (manufacturersMenuForCountries != null && countriesMenu != null)
            {
                var sourceRoleIdsForCountries = db.RoleMenuMaps
                    .Where(rm => rm.MenuItemId == manufacturersMenuForCountries.Id)
                    .Select(rm => rm.RoleId)
                    .Distinct()
                    .ToList();

                var missingCountryMaps = sourceRoleIdsForCountries
                    .Where(roleId => !db.RoleMenuMaps.Any(rm => rm.RoleId == roleId && rm.MenuItemId == countriesMenu.Id))
                    .Select(roleId => new RoleMenuMap
                    {
                        RoleId = roleId,
                        MenuItemId = countriesMenu.Id
                    })
                    .ToList();

                if (missingCountryMaps.Count > 0)
                {
                    db.RoleMenuMaps.AddRange(missingCountryMaps);
                    db.SaveChanges();
                }
            }

            // Backfill: Import Excel menu item under Mua s?m
            var procurementImportsMenu = db.MenuItems.FirstOrDefault(m => m.Key == "procurement-imports");
            if (procurementImportsMenu == null)
            {
                var procurementMenu = db.MenuItems.FirstOrDefault(m => m.Key == "procurement");
                procurementImportsMenu = new MenuItem
                {
                    Key = "procurement-imports",
                    Title = "Import Excel",
                    Link = "/procurement/imports",
                    Icon = "ImportOutlined",
                    DisplayOrder = 5,
                    ParentMenuItemId = procurementMenu?.Id,
                    IsDeleted = false
                };
                db.MenuItems.Add(procurementImportsMenu);
                db.SaveChanges();
            }

            // Assign procurement-imports menu to every role that already has the "orders" sub-menu
            var ordersMenu = db.MenuItems.FirstOrDefault(m => m.Key == "orders");
            if (ordersMenu != null && procurementImportsMenu != null)
            {
                var sourceRoleIdsForImports = db.RoleMenuMaps
                    .Where(rm => rm.MenuItemId == ordersMenu.Id)
                    .Select(rm => rm.RoleId)
                    .Distinct()
                    .ToList();

                var missingImportMaps = sourceRoleIdsForImports
                    .Where(roleId => !db.RoleMenuMaps.Any(rm => rm.RoleId == roleId && rm.MenuItemId == procurementImportsMenu.Id))
                    .Select(roleId => new RoleMenuMap
                    {
                        RoleId = roleId,
                        MenuItemId = procurementImportsMenu.Id
                    })
                    .ToList();

                if (missingImportMaps.Count > 0)
                {
                    db.RoleMenuMaps.AddRange(missingImportMaps);
                    db.SaveChanges();
                }
            }

            // Backfill: Purchase invoice menu under Procurement.
            var purchaseInvoicesMenu = db.MenuItems.FirstOrDefault(m => m.Key == "purchase-invoices");
            if (purchaseInvoicesMenu == null)
            {
                var procurementMenu = db.MenuItems.FirstOrDefault(m => m.Key == "procurement");
                purchaseInvoicesMenu = new MenuItem
                {
                    Key = "purchase-invoices",
                    Title = "Hóa don d?u vào",
                    Link = "/procurement/invoices",
                    Icon = "FileDoneOutlined",
                    DisplayOrder = 6,
                    ParentMenuItemId = procurementMenu?.Id,
                    IsDeleted = false
                };
                db.MenuItems.Add(purchaseInvoicesMenu);
                db.SaveChanges();
            }

            if (ordersMenu != null && purchaseInvoicesMenu != null)
            {
                var sourceRoleIdsForInvoices = db.RoleMenuMaps
                    .Where(rm => rm.MenuItemId == ordersMenu.Id)
                    .Select(rm => rm.RoleId)
                    .Distinct()
                    .ToList();

                var missingInvoiceMaps = sourceRoleIdsForInvoices
                    .Where(roleId => !db.RoleMenuMaps.Any(rm => rm.RoleId == roleId && rm.MenuItemId == purchaseInvoicesMenu.Id))
                    .Select(roleId => new RoleMenuMap
                    {
                        RoleId = roleId,
                        MenuItemId = purchaseInvoicesMenu.Id
                    })
                    .ToList();

                if (missingInvoiceMaps.Count > 0)
                {
                    db.RoleMenuMaps.AddRange(missingInvoiceMaps);
                    db.SaveChanges();
                }
            }

            // Backfill: Profile page accessible to every role
            var profileMenuItem = db.MenuItems.FirstOrDefault(m => m.Key == "my-profile");
            if (profileMenuItem == null)
            {
                profileMenuItem = new MenuItem
                {
                    Key = "my-profile",
                    Title = "H? so ngu?i dùng",
                    Link = "/profile",
                    Icon = "UserOutlined",
                    DisplayOrder = 12,
                    ParentMenuItemId = null,
                    IsDeleted = false
                };
                db.MenuItems.Add(profileMenuItem);
                db.SaveChanges();
            }

            // Assign profile menu item to ALL roles that don't have it yet
            var allRoles = db.Roles.ToList();
            foreach (var role in allRoles)
            {
                if (!db.RoleMenuMaps.Any(rm => rm.RoleId == role.Id && rm.MenuItemId == profileMenuItem.Id))
                {
                    db.RoleMenuMaps.Add(new RoleMenuMap
                    {
                        RoleId = role.Id,
                        MenuItemId = profileMenuItem.Id
                    });
                }
            }
            db.SaveChanges();

            // Backfill: Ki?m kê tài s?n menu item
            var inventoryParentMenu = db.MenuItems.FirstOrDefault(m => m.Key == "inventory");
            if (inventoryParentMenu == null)
            {
                inventoryParentMenu = new MenuItem
                {
                    Key = "inventory",
                    Title = "Ki?m kê tài s?n",
                    Link = null,
                    Icon = "AuditOutlined",
                    DisplayOrder = 10,
                    ParentMenuItemId = null,
                    IsDeleted = false
                };
                db.MenuItems.Add(inventoryParentMenu);
                db.SaveChanges();
            }

            var inventorySessionsMenu = db.MenuItems.FirstOrDefault(m => m.Key == "inventory-sessions");
            if (inventorySessionsMenu == null)
            {
                inventorySessionsMenu = new MenuItem
                {
                    Key = "inventory-sessions",
                    Title = "Ð?t ki?m kê",
                    Link = "/inventory",
                    Icon = "UnorderedListOutlined",
                    DisplayOrder = 1,
                    ParentMenuItemId = inventoryParentMenu.Id,
                    IsDeleted = false
                };
                db.MenuItems.Add(inventorySessionsMenu);
                db.SaveChanges();
            }

            var inventoryReportsMenu = db.MenuItems.FirstOrDefault(m => m.Key == "inventory-reports");
            if (inventoryReportsMenu == null)
            {
                inventoryReportsMenu = new MenuItem
                {
                    Key = "inventory-reports",
                    Title = "Báo cáo ki?m kê",
                    Link = "/inventory/reports",
                    Icon = "BarChartOutlined",
                    DisplayOrder = 2,
                    ParentMenuItemId = inventoryParentMenu.Id,
                    IsDeleted = false
                };
                db.MenuItems.Add(inventoryReportsMenu);
                db.SaveChanges();
            }

            var inventoryDepartmentStockMenu = db.MenuItems.FirstOrDefault(m => m.Key == "inventory-department-stock");
            if (inventoryDepartmentStockMenu == null)
            {
                inventoryDepartmentStockMenu = new MenuItem
                {
                    Key = "inventory-department-stock",
                    Title = "T?n kho tài s?n c? d?nh",
                    Link = "/inventory/department-stock",
                    Icon = "DatabaseOutlined",
                    DisplayOrder = 3,
                    ParentMenuItemId = 2,
                    IsDeleted = false
                };
                db.MenuItems.Add(inventoryDepartmentStockMenu);
                db.SaveChanges();
            }
            else
            {
                inventoryDepartmentStockMenu.Title = "T?n kho tài s?n c? d?nh";
                inventoryDepartmentStockMenu.Link = "/inventory/department-stock";
                inventoryDepartmentStockMenu.Icon = "DatabaseOutlined";
                inventoryDepartmentStockMenu.DisplayOrder = 3;
                inventoryDepartmentStockMenu.ParentMenuItemId = 2;
                inventoryDepartmentStockMenu.IsDeleted = false;
            }

            var inventoryMaterialStockMenu = db.MenuItems.FirstOrDefault(m => m.Key == "inventory-material-stock");
            if (inventoryMaterialStockMenu == null)
            {
                inventoryMaterialStockMenu = new MenuItem
                {
                    Key = "inventory-material-stock",
                    Title = "T?n kho v?t tu tiêu hao",
                    Link = "/inventory/material-stock",
                    Icon = "DatabaseOutlined",
                    DisplayOrder = 4,
                    ParentMenuItemId = 2,
                    IsDeleted = false
                };
                db.MenuItems.Add(inventoryMaterialStockMenu);
                db.SaveChanges();
            }
            else
            {
                inventoryMaterialStockMenu.Title = "T?n kho v?t tu tiêu hao";
                inventoryMaterialStockMenu.Link = "/inventory/material-stock";
                inventoryMaterialStockMenu.Icon = "DatabaseOutlined";
                inventoryMaterialStockMenu.DisplayOrder = 4;
                inventoryMaterialStockMenu.ParentMenuItemId = 2;
                inventoryMaterialStockMenu.IsDeleted = false;
            }

            var inventoryMaterialIssueMenu = db.MenuItems.FirstOrDefault(m => m.Key == "inventory-material-issues");
            if (inventoryMaterialIssueMenu == null)
            {
                inventoryMaterialIssueMenu = new MenuItem
                {
                    Key = "inventory-material-issues",
                    Title = "Xu?t v?t tu tiêu hao",
                    Link = "/inventory/material-issues",
                    Icon = "ExportOutlined",
                    DisplayOrder = 5,
                    ParentMenuItemId = 2,
                    IsDeleted = false
                };
                db.MenuItems.Add(inventoryMaterialIssueMenu);
                db.SaveChanges();
            }
            else
            {
                inventoryMaterialIssueMenu.Title = "Xu?t v?t tu tiêu hao";
                inventoryMaterialIssueMenu.Link = "/inventory/material-issues";
                inventoryMaterialIssueMenu.Icon = "ExportOutlined";
                inventoryMaterialIssueMenu.DisplayOrder = 5;
                inventoryMaterialIssueMenu.ParentMenuItemId = 2;
                inventoryMaterialIssueMenu.IsDeleted = false;
            }

            // Assign inventory menu to roles that have inventory.read permission
            var inventoryMenuItems = new[] { inventoryParentMenu, inventorySessionsMenu, inventoryReportsMenu, inventoryDepartmentStockMenu, inventoryMaterialStockMenu, inventoryMaterialIssueMenu };
            var inventoryRoleNames = new[] {
                SystemRoles.Admin, SystemRoles.Engineer, SystemRoles.Technician,
                SystemRoles.DepartmentUser, SystemRoles.Accountant
            };
            var inventoryRoles = db.Roles
                .Where(r => inventoryRoleNames.Contains(r.Code))
                .ToList();

            foreach (var role in inventoryRoles)
            {
                foreach (var menuItem in inventoryMenuItems)
                {
                    if (!db.RoleMenuMaps.Any(rm => rm.RoleId == role.Id && rm.MenuItemId == menuItem.Id))
                    {
                        db.RoleMenuMaps.Add(new RoleMenuMap { RoleId = role.Id, MenuItemId = menuItem.Id });
                    }
                }
            }
            db.SaveChanges();
        }

        private static void SeedPermissionItems(AppDbContext db)
        {
            // Cleanup legacy tool-transfer permissions now that CCDC transfer uses shared transfer flow.
            var legacyPermissionCodes = new[] { "tooltransfer.create", "tooltransfer.read" };
            var legacyPermissionIds = db.PermissionItems
                .Where(p => legacyPermissionCodes.Contains(p.Code))
                .Select(p => p.Id)
                .ToList();

            if (legacyPermissionIds.Count > 0)
            {
                var legacyMaps = db.PermissionRoleMaps
                    .Where(m => legacyPermissionIds.Contains(m.PermissionItemId))
                    .ToList();

                if (legacyMaps.Count > 0)
                {
                    db.PermissionRoleMaps.RemoveRange(legacyMaps);
                }

                var legacyPermissions = db.PermissionItems
                    .Where(p => legacyPermissionIds.Contains(p.Id))
                    .ToList();

                db.PermissionItems.RemoveRange(legacyPermissions);
                db.SaveChanges();
            }
        }

        private static void DisableAssetManagementMenus(AppDbContext db)
        {
            var disabledKeys = new[]
            {
                "dashboard",
                "management",
                "devices",
                "certificates",
                "procurement",
                "orders",
                "contracts",
                "receipts",
                "allocations",
                "purchase-invoices",
                "procurement-imports",
                "maintenance",
                "plans",
                "tasks",
                "calendar",
                "records",
                "daily-check",
                "checklists",
                "repairs",
                "repairs-list",
                "repairs-create",
                "transfers",
                "transfers-list",
                "transfers-create",
                "asset-outputs",
                "asset-outputs-list",
                "asset-outputs-create",
                "documents",
                "reports",
                "master-data",
                "manufacturers",
                "companies",
                "countries",
                "device-types",
                "item-catalogs",
                "toolkit-catalogs",
                "unit-catalogs",
                "alerts",
                "inventory",
                "inventory-sessions",
                "inventory-reports",
                "inventory-department-stock",
                "inventory-material-stock",
                "inventory-material-issues"
            };

            var menuItems = db.MenuItems
                .Where(menu => disabledKeys.Contains(menu.Key))
                .ToList();

            if (menuItems.Count == 0)
            {
                return;
            }

            var disabledIds = menuItems.Select(menu => menu.Id).ToList();
            var roleMenuMaps = db.RoleMenuMaps
                .Where(map => disabledIds.Contains(map.MenuItemId))
                .ToList();

            if (roleMenuMaps.Count > 0)
            {
                db.RoleMenuMaps.RemoveRange(roleMenuMaps);
            }

            foreach (var menuItem in menuItems)
            {
                menuItem.IsDeleted = true;
            }

            db.SaveChanges();
        }

    }
}
