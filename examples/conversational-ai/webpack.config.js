import path from 'path';
import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: {
        bundle: ['./src/script.js', './src/app.js']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3030',
                pathRewrite: { '^/api': '/api' },
                changeOrigin: true
            }
        },
        compress: true,
        port: 8081,
        hot: true
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'src/index.html', to: 'index.html' },
                { from: 'src/styles.css', to: 'styles.css' },
                { from: 'public', to: 'public' },
            ],
        }),
    ]
};
