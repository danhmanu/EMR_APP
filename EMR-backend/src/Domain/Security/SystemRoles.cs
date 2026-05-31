using System.Globalization;
using System.Text;

namespace EMR.Domain.Security
{
    public static class SystemRoles
    {
        public const string Admin = "ADMIN";
        public const string Engineer = "ENGINEER";
        public const string Technician = "TECHNICIAN";
        public const string DepartmentUser = "DEPARTMENT_USER";
        public const string Accountant = "ACCOUNTANT";
        public const string Procurement = "PROCUREMENT";

        public const string AdminName = "Admin";
        public const string EngineerName = "Engineer";
        public const string TechnicianName = "Technician";
        public const string DepartmentUserName = "Department User";
        public const string AccountantName = "Ke toan";
        public const string ProcurementName = "Mua hang";

        public static readonly IReadOnlyList<string> All = new[]
        {
            Admin,
            Engineer,
            Technician,
            DepartmentUser,
            Accountant,
            Procurement
        };

        public static readonly IReadOnlyDictionary<string, string> DisplayNames = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [Admin] = AdminName,
            [Engineer] = EngineerName,
            [Technician] = TechnicianName,
            [DepartmentUser] = DepartmentUserName,
            [Accountant] = AccountantName,
            [Procurement] = ProcurementName
        };

        private static readonly IReadOnlyDictionary<string, string> AliasMap = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [NormalizeKey(Admin)] = Admin,
            [NormalizeKey(AdminName)] = Admin,
            [NormalizeKey(Engineer)] = Engineer,
            [NormalizeKey(EngineerName)] = Engineer,
            [NormalizeKey("Ky thuat")] = Engineer,
            [NormalizeKey(Technician)] = Technician,
            [NormalizeKey(TechnicianName)] = Technician,
            [NormalizeKey("Vat tu thiet bi")] = Technician,
            [NormalizeKey(DepartmentUser)] = DepartmentUser,
            [NormalizeKey(DepartmentUserName)] = DepartmentUser,
            [NormalizeKey("DeptUser")] = DepartmentUser,
            [NormalizeKey("DepartmentUser")] = DepartmentUser,
            [NormalizeKey("Khoa phong")] = DepartmentUser,
            [NormalizeKey(Accountant)] = Accountant,
            [NormalizeKey(AccountantName)] = Accountant,
            [NormalizeKey("KeToan")] = Accountant,
            [NormalizeKey(Procurement)] = Procurement,
            [NormalizeKey(ProcurementName)] = Procurement,
            [NormalizeKey("MuaHang")] = Procurement
        };

        public static string Normalize(string? role)
        {
            return ToCode(role);
        }

        public static string ToCode(string? role)
        {
            return TryNormalize(role, out var normalized)
                ? normalized
                : role?.Trim().ToUpperInvariant() ?? string.Empty;
        }

        public static bool TryNormalize(string? role, out string normalized)
        {
            normalized = string.Empty;
            if (string.IsNullOrWhiteSpace(role))
            {
                return false;
            }

            return AliasMap.TryGetValue(NormalizeKey(role), out normalized!);
        }

        public static bool IsCanonical(string? role)
        {
            if (string.IsNullOrWhiteSpace(role))
            {
                return false;
            }

            return All.Contains(ToCode(role), StringComparer.OrdinalIgnoreCase);
        }

        public static string GetDisplayName(string? role)
        {
            var code = ToCode(role);
            return DisplayNames.TryGetValue(code, out var displayName)
                ? displayName
                : role?.Trim() ?? string.Empty;
        }

        public static string ToPermissionKey(string? role)
        {
            var normalized = ToCode(role);
            return string.IsNullOrWhiteSpace(normalized)
                ? string.Empty
                : NormalizeKey(normalized).Replace(" ", ".", StringComparison.Ordinal);
        }

        private static string NormalizeKey(string value)
        {
            var normalized = RemoveDiacritics(value.Trim()).ToLowerInvariant();
            var builder = new StringBuilder(normalized.Length);
            var previousWasSpace = false;

            foreach (var ch in normalized)
            {
                if (char.IsLetterOrDigit(ch))
                {
                    builder.Append(ch);
                    previousWasSpace = false;
                    continue;
                }

                if (!previousWasSpace)
                {
                    builder.Append(' ');
                    previousWasSpace = true;
                }
            }

            return builder.ToString().Trim();
        }

        private static string RemoveDiacritics(string value)
        {
            var normalized = value.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(normalized.Length);

            foreach (var ch in normalized)
            {
                var category = CharUnicodeInfo.GetUnicodeCategory(ch);
                if (category != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(ch);
                }
            }

            return builder.ToString().Normalize(NormalizationForm.FormC);
        }
    }
}
