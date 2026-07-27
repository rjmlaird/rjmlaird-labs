<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" version="1.1.0">
  <NamedLayer>
    <se:Name>EMSR897_AOI01_BLP_PRODUCT_facilitiesA_v1</se:Name>
    <UserStyle>
      <se:Name>EMSR897_AOI01_BLP_PRODUCT_facilitiesA_v1</se:Name>
      <se:FeatureTypeStyle>
	  
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Mining or extraction site</se:Name><se:Description>
            <se:Title>Mining or extraction site</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>simplified</ogc:PropertyName>
              <ogc:Literal>Mining or extraction site</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>

		 <se:PolygonSymbolizer>
            <se:Fill>
              <se:GraphicFill>
                <se:Graphic>
                  <se:Mark>
                    <se:WellKnownName>horline</se:WellKnownName>
                    <se:Stroke>
                      <se:SvgParameter name="stroke">#000000</se:SvgParameter>
                    </se:Stroke>
                  </se:Mark>
                </se:Graphic>
              </se:GraphicFill>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke">#000000</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1.5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>

		 <se:PolygonSymbolizer>
            <se:Fill>
              <se:GraphicFill>
                <se:Graphic>
                  <se:Mark>
                    <se:WellKnownName>line</se:WellKnownName>
                    <se:Stroke>
                      <se:SvgParameter name="stroke">#000000</se:SvgParameter>
                    </se:Stroke>
                  </se:Mark>
                </se:Graphic>
              </se:GraphicFill>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke">#000000</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1.5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>

          <se:PolygonSymbolizer>
            <se:Fill>
              <se:GraphicFill>
                <se:Graphic>
                  <se:Mark>
                    <se:WellKnownName>line</se:WellKnownName>
                    <se:Stroke>
                      <se:SvgParameter name="stroke">#000000</se:SvgParameter>
                    </se:Stroke>
                  </se:Mark>
				  <Rotation>90</Rotation>
				</se:Graphic>
              </se:GraphicFill>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke">#000000</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1.5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>
        </se:Rule>
		
		
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Water Well</se:Name><se:Description>
            <se:Title>Water Well</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>simplified</ogc:PropertyName>
              <ogc:Literal>Water Well</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>

		 <se:PolygonSymbolizer>
            <se:Fill>
              <se:GraphicFill>
                <se:Graphic>
                  <se:Mark>
                    <se:WellKnownName>horline</se:WellKnownName>
                    <se:Stroke>
                      <se:SvgParameter name="stroke">#0070ff</se:SvgParameter>
                    </se:Stroke>
                  </se:Mark>
                </se:Graphic>
              </se:GraphicFill>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke">#0070ff</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1.5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>

		 <se:PolygonSymbolizer>
            <se:Fill>
              <se:GraphicFill>
                <se:Graphic>
                  <se:Mark>
                    <se:WellKnownName>line</se:WellKnownName>
                    <se:Stroke>
                      <se:SvgParameter name="stroke">#0070ff</se:SvgParameter>
                    </se:Stroke>
                  </se:Mark>
                </se:Graphic>
              </se:GraphicFill>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke">#0070ff</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1.5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>

          <se:PolygonSymbolizer>
            <se:Fill>
              <se:GraphicFill>
                <se:Graphic>
                  <se:Mark>
                    <se:WellKnownName>line</se:WellKnownName>
                    <se:Stroke>
                      <se:SvgParameter name="stroke">#0070ff</se:SvgParameter>
                    </se:Stroke>
                  </se:Mark>
				  <Rotation>90</Rotation>
				</se:Graphic>
              </se:GraphicFill>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke">#0070ff</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1.5</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>
        </se:Rule>
		
		
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Power plant construction</se:Name><se:Description>
            <se:Title>Power plant construction</se:Title>
          </se:Description>
          <ogc:Filter>
			  <ogc:PropertyIsEqualTo>
				<ogc:PropertyName>simplified</ogc:PropertyName>
				<ogc:Literal>Power plant</ogc:Literal>
			  </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#e600a9</se:SvgParameter>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke">#000001</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-dasharray">4 2 1 2 1 2</se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>
        </se:Rule>
			
		
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Sport and recreation construction</se:Name><se:Description>
            <se:Title>Sport and recreation construction</se:Title>
          </se:Description>
          <ogc:Filter>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>simplified</ogc:PropertyName>
                <ogc:Literal>Sport and recreation constructions</ogc:Literal>
              </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#aaff00</se:SvgParameter>
              <se:SvgParameter name="stroke-width">2</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-linecap">square</se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
        </se:Rule>		
		
		
		
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Water or Aquatic infrastructure</se:Name><se:Description>
            <se:Title>Water or Aquatic infrastructure</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>simplified</ogc:PropertyName>
              <ogc:Literal>Water or Aquatic infrastructure</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#ffd37f</se:SvgParameter>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke">#000001</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-dasharray">4 2 1 2</se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>
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
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#e69800</se:SvgParameter>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke">#000001</se:SvgParameter>
              <se:SvgParameter name="stroke-width">1</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
              <se:SvgParameter name="stroke-dasharray">4 2 1 2</se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>
        </se:Rule>
		
		</se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
