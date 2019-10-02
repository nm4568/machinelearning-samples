using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.ML.Data;

namespace eShopForecast
{
    public class RiskDTO
    {
        public List<RiskData> risk1;
        public List<RiskData> risk2;
        public List<RiskBaseData> riskBase1;
        public List<RiskBaseData> riskBase2;
        public List<RiskImpactData> riskImpact1;
        public List<RiskImpactData> riskImpact2;
        public List<RiskImpactData> riskImpactEntity;
    }

    public class RiskData
    {
        [LoadColumn(0)]
        public float next;

        [LoadColumn(1)]
        public float riskId;

        [LoadColumn(2)]
        public float day;

        [LoadColumn(3)]
        public float riskValue;

        [LoadColumn(4)]
        public float avg;

        [LoadColumn(5)]
        public float count;

        [LoadColumn(6)]
        public float max;

        [LoadColumn(7)]
        public float min;

        [LoadColumn(8)]
        public float prev;

        public override string ToString()
        {
            return $"RiskData [ riskId: {riskId}, day: {day}, next: {next:0000}, value: {riskValue:0000}, avg: {avg:000}, count: {count:00}, max: {max:000}, min: {min}, prev: {prev:0000} ]";
        }

    }

    public class RiskBaseData
    {
        [LoadColumn(0)]
        public float next;

        [LoadColumn(1)]
        public float riskId;

        [LoadColumn(2)]
        public float day;

        [LoadColumn(3)]
        public float riskBaseValue;

        [LoadColumn(4)]
        public float avg;

        [LoadColumn(5)]
        public float count;

        [LoadColumn(6)]
        public float max;

        [LoadColumn(7)]
        public float min;

        [LoadColumn(8)]
        public float prev;

        public override string ToString()
        {
            return $"RiskBaseData [ riskId: {riskId}, day: {day}, next: {next:0000}, baseValue: {riskBaseValue:0000}, avg: {avg:000}, count: {count:00}, max: {max:000}, min: {min}, prev: {prev:0000} ]";
        }

    }
    public class RiskImpactData
    {
        [LoadColumn(0)]
        public float next;

        [LoadColumn(1)]
        public float riskId;

        [LoadColumn(2)]
        public float day;

        [LoadColumn(3)]
        public float riskImpactValue;

        [LoadColumn(4)]
        public float avg;

        [LoadColumn(5)]
        public float count;

        [LoadColumn(6)]
        public float max;

        [LoadColumn(7)]
        public float min;

        [LoadColumn(8)]
        public float prev;

        public override string ToString()
        {
            return $"RiskImpactData [ riskId: {riskId}, day: {day}, next: {next:0000}, impactValue: {riskImpactValue:0000}, avg: {avg:000}, count: {count:00}, max: {max:000}, min: {min}, prev: {prev:0000} ]";
        }
    }

}
