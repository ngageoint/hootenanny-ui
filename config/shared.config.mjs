import { copy } from 'esbuild-plugin-copy';
import { sassPlugin } from 'esbuild-sass-plugin';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).replace('/config', '');


const copyConfig = {
    assets: {
      from: [path.join(__dirname, 'modules', 'Hoot', 'svg', '*')],
      to: [path.join(__dirname, 'img')]
    }
}
  

const sharedConfig = {
    entryPoints: [
        './modules/id.js',
        './modules/Hoot/login.js'
    ],
    outdir: 'dist',
    loader: {
        '.png': 'file', 
        '.svg': 'text',
        '.woff': 'file',
        '.woff2': 'file'
    },
    plugins: [
        copy(copyConfig),
        sassPlugin({
        precompile(source, pathname) {
            // update relative paths to images in url() to be full paths
            let urls = Array.from(source.matchAll(/(url\(['"]?)(\.\.?\/)([^'")]+['"]?\))/g))
            if (urls.length) {
            for (let url of urls) {
                let imgUrl = url[0]
                let realPath = path.join(__dirname, imgUrl.split('url(')[1].split(')')[0].substring(2))
                source = source.replace(imgUrl, `url(${realPath})`)
            }
            }
            // update paths to node_modules files to use full paths
            urls = Array.from(source.matchAll("node_modules"))
            if (urls.length) {
            for (let url of urls) {
                const node_modules_path = path.join(__dirname, 'node_modules')
                source = source.replace(url[0], node_modules_path)
            }
            }
            return source;
        }
        })
    ]
}

export default sharedConfig;