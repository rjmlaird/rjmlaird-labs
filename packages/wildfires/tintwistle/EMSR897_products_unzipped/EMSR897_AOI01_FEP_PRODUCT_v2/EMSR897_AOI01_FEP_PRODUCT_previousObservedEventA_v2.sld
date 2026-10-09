<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" version="1.1.0">
  <NamedLayer>
    <se:Name>EMSR897_AOI01_FEP_PRODUCT_previousObservedEventA_v2</se:Name>
    <UserStyle>
      <se:Name>EMSR897_AOI01_FEP_PRODUCT_previousObservedEventA_v2</se:Name>
      <se:FeatureTypeStyle>
	  
        <se:Rule>
          <se:Abstract>FEP_DEL_GRA</se:Abstract>
          <se:Name>Previous burnt area</se:Name><se:Description>
            <se:Title>Previous burnt area</se:Title>
          </se:Description>
          <ogc:Filter>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>notation</ogc:PropertyName>
                <ogc:Literal>Previous burnt area</ogc:Literal>
              </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#ffdc73</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>
	  
	  
        </se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
