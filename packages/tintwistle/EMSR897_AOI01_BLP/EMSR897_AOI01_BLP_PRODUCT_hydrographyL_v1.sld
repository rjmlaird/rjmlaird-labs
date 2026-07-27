<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" version="1.1.0">
  <NamedLayer>
    <se:Name>EMSR897_AOI01_BLP_PRODUCT_hydrographyL_v1</se:Name>
    <UserStyle>
      <se:Name>EMSR897_AOI01_BLP_PRODUCT_hydrographyL_v1</se:Name>
      <se:FeatureTypeStyle>
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Watercourse</se:Name><se:Description>
            <se:Title>Watercourse</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>simplified</ogc:PropertyName>
              <ogc:Literal>Watercourse</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#000f32</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1.5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-linecap">square</se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
        </se:Rule>
		
		</se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
