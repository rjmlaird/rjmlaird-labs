<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" version="1.1.0">
  <NamedLayer>
    <se:Name>EMSR897_AOI01_DEL_PRODUCT_observedEventA_v1</se:Name>
    <UserStyle>
      <se:Name>EMSR897_AOI01_DEL_PRODUCT_observedEventA_v1</se:Name>
      <se:FeatureTypeStyle>
	  
        <se:Rule>
          <se:Abstract>FEP_DEL</se:Abstract>
          <se:Name>Burnt area</se:Name><se:Description>
            <se:Title>Burnt area</se:Title>
          </se:Description>
          <ogc:Filter>
		  <ogc:PropertyIsEqualTo>
			<ogc:PropertyName>notation</ogc:PropertyName>
			<ogc:Literal>Burnt area</ogc:Literal>
		  </ogc:PropertyIsEqualTo>
          </ogc:Filter>
		  
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#ffaa00</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>

		</se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
