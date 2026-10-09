<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" version="1.1.0">
  <NamedLayer>
    <se:Name>EMSR897_AOI01_FEP_PRODUCT_observedEventP_v2</se:Name>
    <UserStyle>
      <se:Name>EMSR897_AOI01_FEP_PRODUCT_observedEventP_v2</se:Name>
      <se:FeatureTypeStyle>
        <se:Rule>
          <se:Abstract>FEP_DEL_GRA</se:Abstract>
          <se:Name>Active Flames</se:Name><se:Description>
            <se:Title>Active Flames</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>notation</ogc:PropertyName>
              <ogc:Literal>Active Flames</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PointSymbolizer>
            <se:Graphic>
              <se:ExternalGraphic>
                <se:OnlineResource xlink:href="https://emergency.copernicus.eu/images/svg/observed_event_point_active_flames.svg" xlink:type="simple"/>
                <se:Format>image/svg+xml</se:Format>
              </se:ExternalGraphic>
              <se:Size>42</se:Size>
            </se:Graphic>
          </se:PointSymbolizer>
        </se:Rule>
        </se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
