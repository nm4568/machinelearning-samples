using System;
using System.Collections.Generic;
using System.Text;

namespace eShopForecast
{
    public class RiskPrediction
    {
        public float[] ForecastedValues { get; set; }

        public float[] ConfidenceLowerBound { get; set; }

        public float[] ConfidenceUpperBound { get; set; }
    }

}
