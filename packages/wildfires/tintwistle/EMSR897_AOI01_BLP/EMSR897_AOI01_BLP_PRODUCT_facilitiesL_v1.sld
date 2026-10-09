<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" version="1.1.0">
  <NamedLayer>
    <se:Name>EMSR897_AOI01_BLP_PRODUCT_facilitiesL_v1</se:Name>
    <UserStyle>
      <se:Name>EMSR897_AOI01_BLP_PRODUCT_facilitiesL_v1</se:Name>
      <se:FeatureTypeStyle>
	  
	  
	  
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Long-distance pipeline or line</se:Name><se:Description>
            <se:Title>Long-distance pipeline or line</se:Title>
          </se:Description>
          <ogc:Filter>
                <ogc:PropertyIsEqualTo>
                  <ogc:PropertyName>simplified</ogc:PropertyName>
                  <ogc:Literal>Long-distance pipelines or lines</ogc:Literal>
                </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#000000</se:SvgParameter>
              <se:SvgParameter name="stroke-width">2</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-linecap">square</se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:GraphicStroke>
                <se:Graphic>
                  <se:Mark>
                    <se:WellKnownName>circle</se:WellKnownName>
                    <se:Fill>
                      <se:SvgParameter name="fill">#000000</se:SvgParameter>
                    </se:Fill>
                    <Stroke>
                      <CssParameter name="stroke">#000000</CssParameter>
                      <CssParameter name="stroke-width">0</CssParameter>
                    </Stroke>
                  </se:Mark>
                  <se:Size>8</se:Size>
                </se:Graphic>
                <se:Gap>30</se:Gap>
              </se:GraphicStroke>
            </se:Stroke>
          </se:LineSymbolizer>
        </se:Rule>
		
		
		
		
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Local pipeline or line</se:Name><se:Description>
            <se:Title>Local pipeline or line</se:Title>
          </se:Description>
          <ogc:Filter>	 
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>simplified</ogc:PropertyName>
                <ogc:Literal>Local pipelines or lines</ogc:Literal>
              </ogc:PropertyIsEqualTo>			 
          </ogc:Filter>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#cd6666</se:SvgParameter>
              <se:SvgParameter name="stroke-width">2</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-linecap">square</se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:GraphicStroke>
                <se:Graphic>
                  <se:Mark>
                    <se:WellKnownName>circle</se:WellKnownName>
                    <se:Fill>
                      <se:SvgParameter name="fill">#cd6666</se:SvgParameter>
                    </se:Fill>
                    <se:Stroke>
                      <se:SvgParameter name="stroke">#cd6666</se:SvgParameter>
                      <se:SvgParameter name="stroke-width">0</se:SvgParameter>
                    </se:Stroke>
                  </se:Mark>
                  <se:Size>8</se:Size>
                </se:Graphic>
                <se:Gap>30</se:Gap>
              </se:GraphicStroke>
            </se:Stroke>
          </se:LineSymbolizer>
        </se:Rule>
		

        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Dam</se:Name><se:Description>
            <se:Title>Dam</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>simplified</ogc:PropertyName>
              <ogc:Literal>Dam</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#732600</se:SvgParameter>
              <se:SvgParameter name="stroke-width">5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-linecap">square</se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#e1e1e1</se:SvgParameter>
              <se:SvgParameter name="stroke-width">4</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-linecap">square</se:SvgParameter>
              <se:SvgParameter name="stroke-dasharray">2 10</se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
        </se:Rule>		
		
		
		</se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
