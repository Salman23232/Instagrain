import DataUriParser from 'datauri/parser.js'
import path from 'path'

const parser = new DataUriParser()

const getDataUri =  (file) => {
    // getting the extension name
    const extName = path.extname(file.originalname).toString();
    // getting the buffer content
    return parser.format(extName, file.buffer).content
}

export default getDataUri