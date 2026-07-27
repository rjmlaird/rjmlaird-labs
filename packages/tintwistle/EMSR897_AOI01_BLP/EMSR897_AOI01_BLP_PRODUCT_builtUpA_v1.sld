<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" version="1.1.0">
  <NamedLayer>
    <se:Name>EMSR897_AOI01_BLP_PRODUCT_builtUpA_v1</se:Name>
    <UserStyle>
      <se:Name>EMSR897_AOI01_BLP_PRODUCT_builtUpA_v1</se:Name>
      <se:FeatureTypeStyle>
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Residential</se:Name><se:Description>
            <se:Title>Residential</se:Title>
          </se:Description>
          <ogc:Filter>
		  <ogc:PropertyIsEqualTo>
			<ogc:PropertyName>simplified</ogc:PropertyName>
			<ogc:Literal>Residential</ogc:Literal>
		  </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#732600</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1.5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-linecap">square</se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
        </se:Rule>
		
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Non residential</se:Name><se:Description>
            <se:Title>Non residential</se:Title>
          </se:Description>
          <ogc:Filter>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>simplified</ogc:PropertyName>
                <ogc:Literal>Non residential</ogc:Literal>
              </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#686868</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1.5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-linecap">square</se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
        </se:Rule>
		
		
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>School, university and research</se:Name><se:Description>
            <se:Title>School, university and research</se:Title>
          </se:Description>
          <ogc:Filter>
		  <ogc:PropertyIsEqualTo>
			<ogc:PropertyName>simplified</ogc:PropertyName>
			<ogc:Literal>School, university and research buildings</ogc:Literal>
		  </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#ffbee8</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1.5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-linecap">square</se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
        </se:Rule>
		
		
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Hospital or institutional care</se:Name><se:Description>
            <se:Title>Hospital or institutional care</se:Title>
          </se:Description>
          <ogc:Filter>
		  <ogc:PropertyIsEqualTo>
			<ogc:PropertyName>simplified</ogc:PropertyName>
			<ogc:Literal>Hospital or institutional care buildings</ogc:Literal>
		  </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#a80084</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1.5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-linecap">square</se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
        </se:Rule>
		
	
	    <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Military</se:Name><se:Description>
            <se:Title>Military</se:Title>
          </se:Description>
          <ogc:Filter>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>simplified</ogc:PropertyName>
                <ogc:Literal>Military</ogc:Literal>
              </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#737300</se:SvgParameter>
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
