
const path = require('path');
const _ = require("underscore");
const pfs = require('promise-fs');
const ExifParser = require('exif-parser');


const isExist = async (tempPath) => {
    try {
        if (!tempPath) {
            return false;
        }
        const error = await pfs.access(tempPath);
        return !error;
    } catch (e) {
        return false;
    }
};

const mkdir = async function (path, quiet) {
    if (path && !(await isExist(path))) {
        try {
            const err = await pfs.mkdir(path, { recursive: true });
            if (err instanceof Error) {
                throw err;
            }
        } catch (err) {
            if (!quiet) {
                throw err;
            }
        }
    }
}

const imageTypes = [".jpg", ".jpeg", ".gif", ".bmp", ".webp"]; // ".png" is excluded
function escapeDot(arr) {
    return arr.map(e => e.replace(".", "\\."))
}
const imageTypesRegex = new RegExp("(" + escapeDot(imageTypes).join("|") + ")$");
const isImage =  function (fn) {
    return !!fn.toLowerCase().match(imageTypesRegex);
};

//-------------------------------------
//  
//   把完全没有的图片metainfo移动到新文件。其他留在原处
//  
//------------------------------------
let fp = process.argv[2]; //"Y:\\_Photo2\\test-1"
let no_meta_photo_fp = path.resolve(path.resolve(fp, ".."), path.basename(fp)+"-no-meta");
const main = async () => {
    let fileNames = await pfs.readdir(fp, {});
    await mkdir(no_meta_photo_fp);

    for(let ii = 0; ii < fileNames.length; ii++){
        const fn = fileNames[ii];
        if(!isImage(fn)){
           continue;
        }

        const tempFp = path.resolve(fp, fn);
        try{
            console.log(`${ii}/${fileNames.length} ${fn}`);
            const imgbuffer = await pfs.readFile(tempFp);
            const parser = ExifParser.create(imgbuffer);
            parser.enableBinaryFields(true);
            parser.enableTagNames(true);
            // parser.enableImageSize(true);
            parser.enableReturnTags(true);
            const img = parser.parse();
            // console.log(img.tags);
            const tags = img.tags;

            const list = ["Make", "Model", "LensModel", "LensMake", "ExposureMode"];
            const has_no_meta = list.every(e => _.isNull(tags[e]) || _.isUndefined(tags[e]) );
            if(has_no_meta){
                dest_fp = path.resolve(no_meta_photo_fp, fn);
                await pfs.rename(tempFp, dest_fp);
            }
        }catch(e){
            console.error("["+ tempFp + "]", e)
        }
    }
}
main();

