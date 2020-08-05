# hovi_client

This is the hovi_client module, used for accessing data from https://api.hovi.nl/

To refer to this module, add this to your moduledefinition.xml packaging:

```xml
  <packaging download="true">
    <dependency module="hovi_client" repository="https://gitlab.com/webhare/apis/hovi_client.git" moduleversion=">=2.0.0" />
  </packaging>
 ```

This module implements a client for HOVI API V2 as specified on https://api.hovi.nl/api/2/openapi.json

For more information about HOVI and about obtaining API keys please see https://www.hoi.vln/
