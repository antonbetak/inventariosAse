"""Read-only extractor for the supplied workbook; uses only Python's standard library.
All nonempty cells and formulas of sheets 2/3 are retained for auditability.
"""
import sys, json, zipfile, hashlib, xml.etree.ElementTree as ET
from decimal import Decimal
from pathlib import Path

def extract(filename, year):
    raw=Path(filename).read_bytes(); z=zipfile.ZipFile(filename)
    ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    strings=[''.join(t.itertext()) for t in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)]
    sheets=[]; cells=[]
    for num in (2,3):
        data={}
        for c in ET.fromstring(z.read(f'xl/worksheets/sheet{num}.xml')).findall('.//m:c',ns):
            v=c.find('m:v',ns); f=c.find('m:f',ns)
            if v is None: continue
            value=v.text or ''
            if c.get('t')=='s':value=strings[int(value)]
            data[c.get('r')]=value
            cells.append({'hoja':f'Hoja{num}','celda':c.get('r'),'valor':value,'formula':f.text if f is not None else None})
        sheets.append(data)
    s,t=sheets
    cols=['B','H','N','T','Z','AF','AL','AR','AX','BD','BJ','BP','BV','CB','CH','CN','CT']
    vals=['C','J','P','V','AB','AH','AN','AT','AZ','BF','BL','BR','BX','CD','CJ','CP','CV']
    insumos=[{'nombre':s[c+'11'],'demanda':s[v+'13'],'entrega':s[v+'14'],'revision':s[v+'30'],'stock':s[v+'35'],'z':'1.64','nivel':'.95','desv':'.15'} for c,v in zip(cols,vals)]
    # The water/base model contains no dates for the loss samples. Preserve NULL dates.
    loss=[('Garrafones','C'),('Tapas #54 cintillo','I'),('Tapas #56 sin cintillo','P'),('Cofias','V'),('Cubrebocas','AB'),('Botellas de Agua 1 litro','AH'),('Botellas de Agua Medio litro','AN'),('Tapas de agua mini','AT')]
    losses=[{'nombre':name,'inicial':s[col+'48'],'final':s[col+'49']} for name,col in loss]
    products=[{'nombre':t[f'A{r}'],'litros':liters,'precio':str(Decimal(t[f'C{r}'])/Decimal(t[f'B{r}']))} for r,liters in [(8,'20'),(9,'1'),(10,'.5')]]
    sales=[]
    for r,p in zip([8,9,10],products):
        for month,col,total in zip(range(1,7),['B','D','F','H','J','L'],['C','E','G','I','K','M']):
            quantity=int(t[f'{col}{r}']);income=Decimal(t[f'{total}{r}'])
            assert Decimal(quantity)*Decimal(p['precio'])==income, 'Monthly income does not reconcile'
            sales.append({'nombre':p['nombre'],'mes':month,'unidades':quantity,'ingreso':str(income),'precio':p['precio']})
    assert sum(Decimal(v['ingreso']) for v in sales)==Decimal(t['N12'])
    projection=[]
    for r in range(25,49):
        record={'semana':int(t[f'B{r}']),'garrafon':int(t[f'C{r}']),'botella1':int(t[f'D{r}']),'botella500':int(t[f'E{r}'])}
        for key,col in [('agua_neta','O'),('agua_disponible','P'),('agua_con_merma','T'),('litros_extra','V'),('yield_pct','W'),('litros_merma','X'),('costo_merma','Y')]:record[key]=t[f'{col}{r}']
        net=Decimal(record['garrafon'])*20+Decimal(record['botella1'])+Decimal(record['botella500'])/2
        assert net==Decimal(record['agua_neta'])
        assert abs(Decimal(record['costo_merma'])-Decimal(record['litros_merma'])*Decimal(t['E5']))<Decimal('.000001')
        projection.append(record)
    return {'hash':hashlib.sha256(raw).hexdigest(),'anio':int(year),'insumos':insumos,'mermas':losses,'productos':products,'ventas':sales,'proyecciones':projection,'celdas':cells,'resumen':{'ingresos':t['N12'],'costo_merma_proyectado':t['D72'],'litros_extra_proyectados':t['D64']}}

if __name__=='__main__':
    data=extract(sys.argv[1],sys.argv[2]);Path(sys.argv[3]).write_text(json.dumps(data,ensure_ascii=False,indent=2))
    print(json.dumps({'insumos':len(data['insumos']),'ventas':len(data['ventas']),'mermas':len(data['mermas']),'proyecciones':len(data['proyecciones']),'celdas':len(data['celdas']),**data['resumen']}))
