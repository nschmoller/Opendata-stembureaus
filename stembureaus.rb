require 'rubygems'
require 'fastercsv'
require 'open-uri'
require 'json'
require 'ffi'
require 'ffi-geos'
require 'nokogiri'


def buurten_geo_in_enschede
  @buurten_geo_in_enschede ||= Nokogiri::XML(open('https://arcgisp.enschede.nl/ArcGIS/services/OpenData/buurten/MapServer/WFSServer?request=GetFeature&TypeName=Enschede_Buurten&service=WFS&srsname=epsg:4326'),nil,nil,Nokogiri::XML::ParseOptions::RECOVER)  
end

def stembureaus_in_enschede
  @stembureaus_in_enschede ||= JSON.parse(open("http://opendata.enschede.nl/opendata/dataset/output.data?dataset=Stemdistrict&method=stembureau_getall.json&order=0&limit=-1&offset=0").read)
end

def buurten_in_enschede
  return @buurten_in_enschede unless @buurten_in_enschede == nil
   buurten = open("http://opendata.enschede.nl/opendata/dataset/output.data?dataset=buurtnamen&method=buurten_getall.json&order=0&limit=-1&offset=0")
   buurten = buurten.read
   @buurten_in_enschede = JSON.parse(buurten)
   return @buurten_in_enschede 
end

def simplify(str)
  str.downcase.gsub(/(\-|\'t|de|\s|\.|\,|(buurtschap))/,"").gsub('noord','n').gsub('oost','o').gsub('west','w').gsub('zuid','n').strip
end

def buurt_code_voor(buurtnaam)
  buurtcode = nil
  buurten_in_enschede.each do |nc|
    cbs_naam_simple = simplify(nc["buurtnaam"].downcase)
    enschede_naam_simple = simplify(buurtnaam.downcase)
    buurtcode = nc["buurtcode"] if cbs_naam_simple == enschede_naam_simple
  end
  return buurtcode
end

def get_area_for_buurt_code(buurtcode)
  buurten_geo_in_enschede.xpath('//gml:featureMember').each do |node|
    return node.xpath('.//gml:posList').text if node.xpath('.//OpenData_buurten:BUURT').first.text.to_i == buurtcode.to_i
  end
end

def data_combined
  return @data if @data
  data = {}
  arr_of_arrs = FasterCSV.read("buurtcijfers_enschede.csv", {:headers=>true})
  
  arr_of_arrs.each do |r|
    cbs_buurt = r['Regio\'s']
    pers_met_laag_inkomen = r['Personen met laag inkomen']
    buurtcode = buurt_code_voor(cbs_buurt)
    data[buurtcode] = {:cbs_data=>r.to_hash,:geo_data=>get_area_for_buurt_code(buurtcode).split(' ').collect{|l| l.to_f}.each_slice(2).to_a}
  end
  @data = data
  return data
end

#y data_combined


puts "Start!"
File.open('second_result.json', 'w') {|f| f.write( data_combined.to_json ) }
puts "Done!"
