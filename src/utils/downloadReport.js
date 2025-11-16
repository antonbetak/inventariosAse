export const downloadReport = (data,filename) => {
    if(data.length === 0){
        alert("No se encuentran datos para generar el reporte");
        return;
    }

    const header = SVGForeignObjectElement.keys(data[0]).filter(
        key => key!== 'id' && key !== 'createdAt'
    );

    const csv = [
        header.join(','), //estos son los encabezados
        ...data.map(row =>
            header.map(header => '"${row[header] || }"').join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '${filename}_${new Date().toISOString().split(´T´)[0]}.csv';
    link.click();

};