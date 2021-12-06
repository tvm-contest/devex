/* eslint-disable no-restricted-syntax */
import { useContext, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
// material
import {
  Container,
  Typography,
  Button,
  Input,
  Stack,
  Card,
  CardMedia,
  Box,
  Link,
  TextField,
  Grid
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import mergeImages from 'merge-images';
import * as IPFS from 'ipfs-core';
// components
import Page from '../components/Page';
import NFTList from '../components/_dashboard/nft/NFTList';

import StoreContext from '../store/StoreContext';

let ipfs;
IPFS.create().then(async (node) => {
  ipfs = node;
});

//

// ----------------------------------------------------------------------

export default function CreateNFT() {
  const [collectionName, setCollectionName] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');
  const [isSubmitClick, setIsSubmitClick] = useState(false);
  const [layerData, setLayerData] = useState([]);
  const [totalImages, setTotalImages] = useState(0);
  const [nftData, setNftData] = useState([]);
  const [currentLayer, setCurrentLayer] = useState();
  const [over, setOver] = useState([]);
  const {
    state: { account }
  } = useContext(StoreContext);

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone();

  const uploadImageToIpfs = async (file) => {
    // TODO implement upload to IPFS
    // file is data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAA…SjVDpQJfhcdt/3Hrt7ev+H+rDD13H5jEOAAAAAElFTkSuQmCC
    // console.log('uploadImageTiIpfs', file);
    const fileInfo = await ipfs.add(file);
    // console.log(fileInfo.path);
    return fileInfo.path;
  };

  const handleAddMultiImage = (files) => {
    const newArr = layerData.filter((elem) => {
      if (elem.id === currentLayer) {
        Object.entries(files).forEach(([key, value]) => {
          console.log(key);
          elem.imagArr.push({
            id: Math.floor(Math.random() * 100000),
            traitVal: '',
            src: URL.createObjectURL(value),
            traitRar: ''
          });
        });
      }
      return elem;
    });
    setLayerData(newArr);
  };

  const getDataForBlockchain = async () => {
    const uploadArrayPromise = [];
    for (const d of nftData) {
      uploadArrayPromise.push(uploadImageToIpfs(d.image));
    }
    const uploadedData = await Promise.all(uploadArrayPromise);

    const returnData = [];

    for (const [key, data] of Object.entries(nftData)) {
      returnData.push({ ...data, image: uploadedData[key] });
    }

    return returnData;
  };

  useEffect(() => {
    handleAddMultiImage(acceptedFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedFiles]);

  const handleAddLayer = () => {
    setLayerData([
      ...layerData,
      {
        id: Math.floor(Math.random() * 1000),
        traitName: '',
        imagArr: []
      }
    ]);
  };

  const handleGenerateImages = async () => {
    setIsSubmitClick(true);
    if (!totalImages) {
      // TODO set errors
      alert('TODO set totel images');
      return;
    }
    const imagesToGenerate = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const layer of layerData) {
      let totalRarity = 0;
      const newLayer = {
        traitName: layer.traitName,
        images: []
      };
      // eslint-disable-next-line no-restricted-syntax
      for (const image of layer.imagArr) {
        // TODO errors
        totalRarity += parseInt(image.traitRar, 10) || 1;
      }

      const coeefficient = totalImages / totalRarity;
      for (const image of layer.imagArr) {
        const images = new Array(Math.ceil(coeefficient * parseInt(image.traitRar, 10))).fill({
          traitValue: image.traitVal,
          src: image.src
        });
        newLayer.images = [...newLayer.images, ...images];
      }
      imagesToGenerate.push(newLayer);
    }

    const finalImagesList = [];

    for (let i = 0; i < totalImages; i += 1) {
      const layers = [];
      for (const layer of imagesToGenerate) {
        const randomIndex = Math.floor(Math.random() * layer.images.length);
        layers.push({
          image: layer.images[randomIndex].src,
          traitName: layer.traitName,
          traitValue: layer.images[randomIndex].traitValue
        });
        layer.images.splice(randomIndex, 1);
      }
      finalImagesList.push(layers);
    }

    const mergePromise = [];
    for (const image of finalImagesList) {
      const images = [];
      for (const layer of image) {
        images.push(layer.image);
      }
      mergePromise.push(mergeImages(images));
    }

    const img = await Promise.all(mergePromise);

    const andFinalImages = [];
    for (const [key, image] of Object.entries(finalImagesList)) {
      const traits = [];
      for (const i of image) {
        traits.push({
          trait_type: i.traitName,
          value: i.traitValue
        });
      }
      andFinalImages.push({
        name: `${collectionName}#${key}`,
        description: collectionDesc,
        image: img[key],
        traits,
        status: 'new'
      });
    }
    setNftData(andFinalImages);
    console.log(andFinalImages);
  };

  const handleTraitNameChange = (val, currentId) => {
    const newArr = layerData.filter((elem) =>
      elem.id === currentId ? (elem.traitName = val) : elem
    );
    setLayerData(newArr);
  };

  const handleDeleteLayer = (currentLayer) => {
    const newArr = layerData.filter((elem) => elem.id !== currentLayer);
    setLayerData(newArr);
  };

  const handleImageUpdate = (val, type, index, currentId) => {
    const newArr = layerData.filter((elem) => {
      if (elem.id === currentId) {
        if (type === 'name') {
          elem.imagArr[index].traitVal = val;
        } else {
          elem.imagArr[index].traitRar = val;
        }
      }
      return elem;
    });
    setLayerData(newArr);
  };

  const handleImageDelete = (index, currentId) => {
    const newArr = layerData.filter((elem) => {
      if (elem.id === currentId) {
        elem.imagArr.splice(index, 1);
      }
      return elem;
    });
    setLayerData(newArr);
  };

  const handleClick = (dataId) => {
    if (over.includes(dataId)) {
      if (window.confirm('Are you want to delete this Image?')) {
        const newArr = over.filter((x) => x !== dataId);
        setOver(newArr);
      }
    } else {
      setOver([...over, dataId]);
    }
  };

  if (!account.isReady) {
    return (
      <Page title="Create you new Nft">
        <Container>
          <Typography variant="h4" sx={{ mb: 5 }}>
            <Link underline="none" component={RouterLink} to="/dashboard/login">
              <Button fullWidth variant="contained">
                Login first
              </Button>
            </Link>
          </Typography>
        </Container>
      </Page>
    );
  }

  return (
    <Page title="Create you new Nft">
      <Container>
        <Typography variant="h4" sx={{ mb: 5 }}>
          Create a new NFTs
        </Typography>
        <Typography variant="h4" sx={{ mb: 5 }}>
          TODO Alex to provide detailed description here
        </Typography>
      </Container>

      <Container>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Collection Name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              helperText={isSubmitClick && !collectionName}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Number of NFTs"
              type="number"
              value={totalImages}
              onChange={(e) => {
                setTotalImages(e.target.value);
              }}
              helperText={isSubmitClick && !totalImages}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Collection Description"
              value={collectionDesc}
              onChange={(e) => setCollectionDesc(e.target.value)}
              helperText={isSubmitClick && !collectionDesc}
              fullWidth
            />
          </Grid>
        </Grid>
        <Typography variant="h6" sx={{ marginTop: 1 }}>
          Layers
        </Typography>
        {layerData &&
          layerData.map((data) => (
            <Stack
              key={data.id}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 1, py: 2 }}
              onClick={() => setCurrentLayer(data.id)}
            >
              <Stack direction="column">
                <Input
                  placeholder="Trait Name"
                  value={data.traitName}
                  onChange={(e) => handleTraitNameChange(e.target.value, data.id)}
                  error={isSubmitClick && !data.traitName}
                />
                <Button
                  variant="contained"
                  component="label"
                  style={{ position: 'relative', marginTop: 10, marginBottom: 10 }}
                >
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
                    multiple
                    onChange={(e) => handleAddMultiImage(e.target.files)}
                    hidden
                  />
                </Button>
                <Button
                  variant="contained"
                  component="label"
                  onClick={() => handleDeleteLayer(data.id)}
                >
                  Delete Layer
                </Button>
              </Stack>
              <div
                {...getRootProps({
                  className: 'dropzone',
                  onDragEnter: () => setCurrentLayer(data.id)
                })}
                style={{ width: '100%', paddingLeft: 25 }}
              >
                <input {...getInputProps()} />
                <Stack direction="row" alignItems="center" sx={{ marginTop: 2 }}>
                  {data.imagArr.length ? (
                    data.imagArr.map((file, index) => (
                      <Card
                        key={file.id}
                        variant="outlined"
                        sx={{
                          maxWidth: 200,
                          maxHeight: 150,
                          padding: 1,
                          marginRight: 2,
                          position: 'relative'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleClick(file.id);
                        }}
                      >
                        {over.includes(file.id) && (
                          <Box
                            sx={{
                              position: 'absolute',
                              right: 1,
                              padding: 1,
                              border: '1px solid #000',
                              margin: '35px 0 0',
                              borderRadius: 1,
                              background: '#fff',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleImageDelete(index, data.id)}
                          >
                            Delete Image
                          </Box>
                        )}
                        <Input
                          placeholder="Trait Value"
                          value={file.traitVal}
                          onChange={(e) =>
                            handleImageUpdate(e.target.value, 'name', index, data.id)
                          }
                          error={isSubmitClick && !file.traitVal}
                        />
                        <CardMedia
                          component="img"
                          height="50"
                          width="10"
                          image={file.src}
                          alt="Drop Pic"
                          style={{ marginTop: 5, marginBottom: 5 }}
                        />
                        <Input
                          placeholder="Trait Rarity"
                          value={file.traitRar}
                          onChange={(e) =>
                            handleImageUpdate(e.target.value, 'rarity', index, data.id)
                          }
                          error={isSubmitClick && !file.traitRar}
                        />
                      </Card>
                    ))
                  ) : (
                    <p style={{ width: '100%', marginBlockStart: 0, height: 80 }}>
                      Drag 'n' drop some files here, or click to select files
                    </p>
                  )}
                </Stack>
              </div>
            </Stack>
          ))}
        <Button onClick={handleAddLayer}>Add another layer</Button>
        <Button onClick={handleGenerateImages}>Generate images</Button>
        <NFTList nfts={nftData} />
        {!!nftData.length && (
          <Button onClick={getDataForBlockchain}> TODO getDataForBlockchain</Button>
        )}
      </Container>
    </Page>
  );
}
