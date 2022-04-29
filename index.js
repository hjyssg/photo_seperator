
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

const imageTypes = [".jpg", ".png", ".jpeg", ".gif", ".bmp", ".webp"];
function escapeDot(arr) {
    return arr.map(e => e.replace(".", "\\."))
}
const imageTypesRegex = new RegExp("(" + escapeDot(imageTypes).join("|") + ")$");
const isImage =  function (fn) {
    return !!fn.toLowerCase().match(imageTypesRegex);
};

let fp = "Y:\\_Photo2\\2022"
let photo_fp_1 = path.resolve(fp, "photo_main");
let photo_fp_2 = path.resolve(fp, "photo_other");




const main = async () => {
    let fileNames = await pfs.readdir(fp, {});
    await mkdir(photo_fp_1);
    await mkdir(photo_fp_2);

    for(let fn of fileNames){
        if(!isImage(fn)){
           continue;
        }

        let dest_fp = path.resolve(photo_fp_1, fn);
        const tempFp = path.resolve(fp, fn);

        try{
            console.log(tempFp);
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
                dest_fp = path.resolve(photo_fp_2, fn);
            }
        }catch(e){
            console.error("["+ tempFp + "]", e)
        }

        try{
            await pfs.copyFile(tempFp, dest_fp);
        }catch(e){
            console.error("["+ tempFp + "]", e)
        }
    }
}
main();

