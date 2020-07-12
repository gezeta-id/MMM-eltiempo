# Module: Weather Forecast in Spain

This module reads official AEMET data through el-tiempo.net API and presents current conditions for the day and a small graphic forecast on temperature and rain.

It doesn't need any API key or registration as the API is publicly open.

## Configuration

Refer to MM's documentation about configuration. This module takes the following configuration parameters:

 * `cityId`: This takes the form of a 5 digit id (e.g. `'28079'`). You can find this id by visiting https://el-tiempo.net/ searching for your location and picking it up from the URL.
 * `updateInterval` is set by default to 30 minutes (`30*60*1000`). You can modify this to reload information more or less often, but the recommended value should be fine.
 * `mode` can take two values: `'full'` to include the forecast graph or `'small'` to omit it.


