<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" version="1.1.0">
  <NamedLayer>
    <se:Name>EMSR897_AOI01_BLP_PRODUCT_naturalLandUseA_v1</se:Name>
    <UserStyle>
      <se:Name>EMSR897_AOI01_BLP_PRODUCT_naturalLandUseA_v1</se:Name>
      <se:FeatureTypeStyle>
		    <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Pastures</se:Name><se:Description>
            <se:Title>Pastures</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:Or>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>info</ogc:PropertyName>
                <ogc:Literal>23-Pastures</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>info</ogc:PropertyName>
                <ogc:Literal>231-Pastures</ogc:Literal>
              </ogc:PropertyIsEqualTo>
            </ogc:Or>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#e6e64d</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Land principally occupied by agriculture, with significant areas of natural vegetation</se:Name><se:Description>
            <se:Title>Land principally occupied by agriculture, with significant areas of natural vegetation</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>info</ogc:PropertyName>
              <ogc:Literal>243-Land principally occupied by agriculture, with significant areas of natural vegetation</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#e6cc4d</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Broad-leaved forest</se:Name><se:Description>
            <se:Title>Broad-leaved forest</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>info</ogc:PropertyName>
              <ogc:Literal>311-Broad-leaved forest</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#80ff00</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Coniferous forest</se:Name><se:Description>
            <se:Title>Coniferous forest</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>info</ogc:PropertyName>
              <ogc:Literal>312-Coniferous forest</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#00a600</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Mixed forest</se:Name><se:Description>
            <se:Title>Mixed forest</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>info</ogc:PropertyName>
              <ogc:Literal>313-Mixed forest</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#4dff00</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Natural grassland</se:Name><se:Description>
            <se:Title>Natural grassland</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>info</ogc:PropertyName>
              <ogc:Literal>321-Natural grassland</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#ccf24d</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Moors and heathland</se:Name><se:Description>
            <se:Title>Moors and heathland</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>info</ogc:PropertyName>
              <ogc:Literal>322-Moors and heathland</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#a6ff80</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Transitional woodland shrub</se:Name><se:Description>
            <se:Title>Transitional woodland shrub</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>info</ogc:PropertyName>
              <ogc:Literal>324-Transitional woodland shrub</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#a6f200</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Peatbogs</se:Name><se:Description>
            <se:Title>Peatbogs</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>info</ogc:PropertyName>
              <ogc:Literal>412-Peatbogs</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#a6a6ff</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Abstract>REF_BLP</se:Abstract>
          <se:Name>Other</se:Name><se:Description>
            <se:Title>Other</se:Title>
          </se:Description>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>info</ogc:PropertyName>
              <ogc:Literal>998-Other</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#828282</se:SvgParameter>
            </se:Fill>
          </se:PolygonSymbolizer>
        </se:Rule>
		</se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
