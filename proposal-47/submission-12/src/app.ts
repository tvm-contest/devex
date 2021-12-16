import express, { Request, Response } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { globals } from './config/globals';

import { indexRouter } from './routes/index';
import { tokensInfoForm } from './routes/tokensInfoForm';
import { tokensListRouter } from './routes/tokensList';
import { collectionsListRouter } from './routes/collectionsList';
import { saveCollectionParams } from './routes/saveCollectionParams';
import { createCollectionRouter } from './routes/createCollection';
import { loadIPFSRouter } from './routes/loadIPFS';
import { debotRouter } from './routes/debot';
import { settingsRouter } from './routes/settings';

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set('views', path.join(globals.APP_ROOT, 'views'));
app.set('view engine', 'pug');

app.use(cors());
app.use(fileUpload({
    createParentPath: true,
}));
app.use(globals.BASE_PATH, express.static(globals.PUBLIC_ROOT));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000 }));
app.use(bodyParser.json({limit: "50mb"}));

app.use('/', indexRouter);
app.use('/tokensInfoForm', tokensInfoForm);
app.use('/tokensList', tokensListRouter);
app.use('/collectionsList', collectionsListRouter);
app.use('/saveCollectionParams', saveCollectionParams);
app.use('/loadIPFS', loadIPFSRouter);
app.use("/createCollection", createCollectionRouter);
app.use("/debot", debotRouter);
app.use("/settings", settingsRouter);

app.use((req: Request, res: Response) => {
    res.status(404);
    res.json({ error: 'Not found' });
});

app.listen(globals.APP_PORT, () => {
    console.log(`Running on PORT ${globals.APP_PORT}.`);
});
