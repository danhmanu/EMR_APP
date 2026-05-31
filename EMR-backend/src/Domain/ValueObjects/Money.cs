using System;

namespace EMR.Domain.ValueObjects
{
    /// <summary>
    /// Immutable value object representing a monetary line-item with unit price and VAT rate.
    /// </summary>
    public record Money
    {
        public decimal UnitPriceExcludingVat { get; init; }
        public decimal VatRate { get; init; }

        public Money(decimal unitPriceExcludingVat, decimal vatRate)
        {
            if (vatRate < 0 || vatRate > 100)
                throw new ArgumentOutOfRangeException(nameof(vatRate), "VatRate must be between 0 and 100.");
            UnitPriceExcludingVat = unitPriceExcludingVat;
            VatRate = vatRate;
        }

        /// <summary>Calculates total amount including VAT for a given quantity.</summary>
        public decimal CalcLineTotal(int quantity) =>
            CalcLineTotal(UnitPriceExcludingVat, VatRate, quantity);

        /// <summary>Static helper for one-off allocation-detail total computation.</summary>
        public static decimal CalcLineTotal(decimal unitPrice, decimal vatRate, int quantity) =>
            Math.Round(quantity * unitPrice * (1 + vatRate / 100), 2, MidpointRounding.AwayFromZero);
    }
}
