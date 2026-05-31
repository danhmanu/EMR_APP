using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace EMR.Api
{
    public sealed class AssetManagementControllerConvention : IApplicationModelConvention
    {
        private static readonly HashSet<string> AssetControllerNames = new(StringComparer.OrdinalIgnoreCase)
        {
            "Accessories",
            "Alerts",
            "Calibrations",
            "CertificateTypes",
            "Companies",
            "Countries",
            "DailyInspection",
            "DeviceAssetOutputs",
            "Devices",
            "DeviceTypes",
            "Documents",
            "GoodsAllocation",
            "GoodsReceipts",
            "Inventory",
            "ItemCatalogs",
            "Maintenance",
            "Manufacturers",
            "MasterData",
            "ProcurementCatalogs",
            "ProcurementImports",
            "PurchaseContracts",
            "PurchaseInvoices",
            "PurchaseOrders",
            "RepairAttachments",
            "RepairExecutions",
            "RepairRequests",
            "ToolKitCatalogs",
            "Transfer",
            "UnitCatalogs"
        };

        private readonly bool _enabled;

        public AssetManagementControllerConvention(bool enabled)
        {
            _enabled = enabled;
        }

        public void Apply(ApplicationModel application)
        {
            if (_enabled)
            {
                return;
            }

            for (var index = application.Controllers.Count - 1; index >= 0; index--)
            {
                if (AssetControllerNames.Contains(application.Controllers[index].ControllerName))
                {
                    application.Controllers.RemoveAt(index);
                }
            }
        }
    }
}
