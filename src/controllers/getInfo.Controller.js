const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
const upload = multer({ dest: 'uploads/' });

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const textract = new AWS.Textract();

const controller = {};

const identifyDocumentType = (text) => {
  console.log('Identifying document type...');
  const normalizedText = text.toLowerCase().trim();
  console.log('Normalized text:', normalizedText);
  if (normalizedText.includes('república bolivariana de venezuela')) {
    return 'cedula';
  } else if (normalizedText.includes('licencia para conducir')) {
    return 'licencia';
  } else if (normalizedText.includes('certificado de circulación') || normalizedText.includes('ap1')) {
    return 'certificado';
  }
  return 'desconocido';
};

  // Función para extraer datos de una cédula
  const extractCedulaData = (text) => {
    const lines = text.split('\n');
    const data = {};

    lines.forEach(line => {
      if (line.includes('V')) {
        data.cedula = line.split('V')[1].trim();
      } else if (line.includes('APELLIDOS')) {
        data.apellidos = lines[lines.indexOf(line) + 1].trim();
      } else if (line.includes('NOMBRES')) {
        data.nombres = lines[lines.indexOf(line) + 1].trim();
      } else if (line.includes('F. NACIMIENTO')) {
        data.fechaNacimiento = line.split('F. NACIMIENTO')[1].trim();
      } else if (line.includes('NACIONALIDAD')) {
        data.nacionalidad = line.split('NACIONALIDAD')[1].trim();
      }
    });

    console.log('Datos de Cédula:', JSON.stringify(data)); // Mostrar datos de cédula por consola
    return data;
  };

  // Función para extraer datos de una licencia de conducir
  const extractLicenciaData = (text) => {
    const lines = text.split('\n');
    const data = {};

    lines.forEach(line => {
      if (line.includes('Nro. de Licencia')) {
        const parts = line.split('Nro. de Licencia:');
        if (parts.length > 1) data.numeroLicencia = parts[1].trim();
      } else if (line.includes('Apellidos')) {
        const parts = line.split('Apellidos:');
        if (parts.length > 1) data.apellidos = parts[1].trim();
      } else if (line.includes('Nombres')) {
        const parts = line.split('Nombres:');
        if (parts.length > 1) data.nombres = parts[1].trim();
      } else if (line.includes('F.Nacimiento')) {
        const parts = line.split('F.Nacimiento:');
        if (parts.length > 1) data.fechaNacimiento = parts[1].trim();
      } else if (line.includes('Sexo')) {
        const parts = line.split('Sexo:');
        if (parts.length > 1) data.sexo = parts[1].trim();
      } else if (line.includes('F. Expedicion')) {
        const parts = line.split('F. Expedicion:');
        if (parts.length > 1) data.fechaExpedicion = parts[1].trim();
      } else if (line.includes('F. Vencimiento')) {
        const parts = line.split('F. Vencimiento:');
        if (parts.length > 1) data.fechaVencimiento = parts[1].trim();
      } else if (line.includes('Tipo')) {
        const parts = line.split('Tipo:');
        if (parts.length > 1) data.tipo = parts[1].trim();
      }
    });

    console.log('Datos de Licencia:', JSON.stringify(data)); // Mostrar datos de licencia por consola
    return data;
  };

const extractData = (text, patterns, years) => {
  console.log('Extracting data...');
  const data = {};
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  console.log('Lines:', lines);

  // Extraer información utilizando patrones definidos
  lines.forEach(line => {
    for (const [key, regex] of Object.entries(patterns)) {
      const match = line.match(regex);
      if (match) {
        console.log(`Match found for ${key}:`, match[1].trim());
        data[key] = match[1].trim();
      }
    }
  });

  // Buscar número de carrocería y serial de motor con longitud variable
  const generalPattern = /([A-Z0-9]{15,})/gi; // Captura cualquier texto alfanumérico con longitud de 15 o más caracteres
  const matches = text.match(generalPattern);
  console.log('General pattern matches:', matches);

  if (matches) {
    // Asignar el primer match como número de carrocería si no está definido
    if (!data.numero_carroceria) {
      data.numero_carroceria = matches[0].trim();
    }
    // Asignar el segundo match como serial de motor si está disponible y no está definido
    if (matches[1] && !data.serial_de_motor) {
      data.serial_de_motor = matches[1].trim();
    } else if (!data.serial_de_motor) {
      data.serial_de_motor = matches[0].trim(); // Si solo hay un match, asignar el mismo valor
    }
  }

  // Buscar placa en el texto
  const platePattern = /\b[A-Z0-9]{7}\b/i;
  const plateMatch = text.match(platePattern);
  console.log('Plate pattern match:', plateMatch);
  if (plateMatch) {
    data.placa = plateMatch[0];
  }

  // Buscar marca en el texto
  const marcaPattern = new RegExp(`\\b(${marca.join('|')})\\b`, 'i');
  const marcaMatch = text.match(marcaPattern);
  console.log('Marca pattern match:', marcaMatch);
  if (marcaMatch) {
    data.marca = marcaMatch[1];
  }

  // Buscar año en el texto y agregarlo a los datos si coincide
  const yearMatch = years.find(year => text.includes(year));
  console.log('Year match:', yearMatch);
  if (yearMatch) {
    data.año = yearMatch;
  }

  console.log('Extracted data:', data);
  return data;
};

const colors = [
  'Rojo', 'Azul', 'Verde', 'Negro', 'Plata','Blanco', 'Gris', 'Amarillo', 'Naranja', 
  'Violeta', 'Marrón', 'Beige', 'Plateado', 'Dorado', 'Azul Marino', 'Verde Oscuro',
  'Rojo Oscuro', 'Azul Claro', 'Verde Claro', 'Gris Oscuro', 'Gris Claro',
  'Negro Mate', 'Blanco Perlado', 'Borgoña'
];

const ano = [
  "1970", "1971", "1972", "1973", "1974", "1975", "1976", "1977", "1978", "1979",
  "1980", "1981", "1982", "1983", "1984", "1985", "1986", "1987", "1988", "1989",
  "1990", "1991", "1992", "1993", "1994", "1995", "1996", "1997", "1998", "1999",
  "2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009",
  "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019",
  "2020", "2021", "2022", "2023", "2024"
];

const marca = [
  "ABARTH", "ALFA ROMEO", "ARO", "ASIA", "ASIA MOTORS", "ASTON MARTIN", "AUDI", "AUSTIN", 
  "AUVERLAND", "BENTLEY", "BERTONE", "BMW", "CADILLAC", "CHEVROLET", "CHRYSLER", "CITROEN", 
  "CORVETTE", "DACIA", "DAEWOO", "DAF", "DAIHATSU", "DAIMLER", "DODGE", "FERRARI", "FIAT", 
  "FORD", "GALLOPER", "GMC", "HONDA", "HUMMER", "HYUNDAI", "INFINITI", "INNOCENTI", "ISUZU", 
  "IVECO", "IVECO-PEGASO", "JAGUAR", "JEEP", "KIA", "LADA", "LAMBORGHINI", "LANCIA", 
  "LAND-ROVER", "LDV", "LEXUS", "LOTUS", "MAHINDRA", "MASERATI", "MAYBACH", "MAZDA", 
  "MERCEDES BENZ", "MG", "MINI", "MITSUBISHI", "MORGAN", "NISSAN", "OPEL", "PEUGEOT", 
  "PONTIAC", "PORSCHE", "RENAULT", "ROLLS-ROYCE", "ROVER", "SAAB", "SANTANA", "SEAT", 
  "SKODA", "SMART", "SSANGYONG", "SUBARU", "SUZUKI", "TALBOT", "TATA", "TOYOTA", 
  "UMM", "VAZ", "VOLKSWAGEN", "VOLVO", "WARTBURG", "HINO", "KEEWAY", "BAJAJ", "JAC", 
  "BERA", "HAOJUE", "CHERY", "MACK", "YAMAHA", "REMOLQUES", "MARCA DE PRUEBA", 
  "HAIMA", "KYMC", "LINHAI", "PIAGGIO", "VENIRAUTO", "BATEAS GERPLAP", 
  "FRENOS DEL AIRE DEL C", "REMOLQUEZ WAL", "DONGFENG", "SKYGO", "KAWASAKI", "BENELLI", 
  "TRIUMPH", "VESPA", "HARLEY-DAVIDSON", "MD", "ENCAVA", "TIUNA", "SPORTSTER", "SG", 
  "DUCATI", "CHANGAN", "INTERNATIONAL", "DFSK", "REMOLQUES", "MAXUS", "SAIPA", 
  "FREIGHTLINER", "TORO", "CHUTOS MACK", "LINCOLN"
];

const colorPattern = new RegExp(`\\b(${colors.join('|')})\\b`, 'i');

const documentPatterns = {
  cedula: {
    nombre: /nombres:\s*(.+)/i,
    apellido: /apellidos:\s*(.+)/i,
    numero_de_cedula: /\b(v\s?\d+)\b/i,
    fNacimiento: /f\.\s*nacimiento:\s*(\d{2}\/\d{2}\/\d{4})/i
  },
  licencia: {
    nombre: /nombres:\s*(.+)/i,
    apellido: /apellidos:\s*(.+)/i,
    fecha_nacimiento: /f\. nacimiento:\s*(\d{2}\/\d{2}\/\d{4})/i,
    fecha_vencimiento: /f\. vencimiento:\s*(\d{2}\/\d{2}\/\d{4})/i,
    cedula: /\b(v\s?\d+)\b/i,
    sexo: /sexo:\s*(.+)/i
  },
  certificado: {
    color: colorPattern,
    numero_carroceria: /número de carrocería:\s*(.+)/i,
    serial_de_motor: /serial de motor:\s*(.+)/i,
    placa: /placa:\s*(\w+)/i,
    año: /\b(\d{4})\b/i,
    ocupantes: /ocupantes:\s*(\d+)/i,
    marca: new RegExp(`\\b(${marca.join('|')})\\b`, 'i'),
    modelo: /modelo:\s*(.+)/i
  }
};

const createJsonResponse = (documentType, data) => {
  console.log('Creating JSON response...');
  console.log('Document Type:', documentType);
  console.log('Extracted Data:', data);
  let responseJson;
  switch (documentType) {
    case 'cedula':
      responseJson = {
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        numero_de_cedula: data.numero_de_cedula || '',
        fNacimiento: data.fNacimiento || ''
      };
      break;
    case 'licencia':
      responseJson = {
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        fecha_nacimiento: data.fecha_nacimiento || '',
        fecha_vencimiento: data.fecha_vencimiento || '',
        cedula: data.cedula || '',
        sexo: data.sexo || ''
      };
      break;
    case 'certificado':
      responseJson = {
        color: data.color || '',
        numero_carroceria: data.numero_carroceria || '',
        serial_de_motor: data.serial_de_motor || '',
        placa: data.placa || '',
        año: data.año || '',
        ocupantes: data.ocupantes || '',
        marca: data.marca || '',
        modelo: data.modelo || ''
      };
      break;
    default:
      responseJson = { error: 'Tipo de documento desconocido' };
  }
  console.log('Response JSON:', responseJson);
  return responseJson;
};

controller.uploadArchive = async (req, res) => {
  console.log('Handling file upload...');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Upload Error:', err);
      return res.status(500).send({ error: 'Error al cargar el archivo' });
    }

    const file = req.file;
    console.log('Uploaded File:', file);
    const fileContent = fs.readFileSync(file.path);
    console.log('File Content Length:', fileContent.length);

    const params = {
      Document: {
        Bytes: fileContent
      }
    };

    try {
      const data = await textract.detectDocumentText(params).promise();
      console.log('Textract Response:', data);

      const extractedText = data.Blocks.filter(block => block.BlockType === 'LINE').map(line => line.Text).join('\n');
      console.log('Extracted Text:', extractedText);

      const documentType = identifyDocumentType(extractedText);
      console.log('Document Type Identified:', documentType);

      const patterns = documentPatterns[documentType] || {};
      const responseData = extractData(extractedText, patterns, ano);
      const responseJson = createJsonResponse(documentType, responseData);

      await unlinkFile(file.path); // Eliminar el archivo después del procesamiento
      res.status(200).json(responseJson);
    } catch (error) {
      console.error('Processing Error:', error);
      res.status(500).send({ error: 'Error al procesar el documento' });
    }
  });
};

module.exports = controller;
