using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.ML;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc;
using eShopForecast;

namespace eShopDashboard.Controllers
{
    [Produces("application/json")]
    [Route("api/[controller]")]
    [ApiController]
    public class RiskController : ControllerBase
    {

        [HttpGet]
        [Route("/risk")]
        public IActionResult GetRisk()
        {
            var res = Program.GetRiskData();
            return Ok(res);
        }

    }
}