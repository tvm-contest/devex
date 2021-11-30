import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// material
import { Container, Typography, Button, Input, Stack, Card, CardMedia } from '@mui/material';
import { useDropzone } from 'react-dropzone';
// components
import Page from '../components/Page';

import StoreContext from '../store/StoreContext';
//

// ----------------------------------------------------------------------

export default function CreateNFT() {
  const navigate = useNavigate();
  const [layerData, setLayerData] = useState([]);
  const [currentLayer, setCurrentLayer] = useState();
  const {
    state: { account }
  } = useContext(StoreContext);

  useEffect(() => {
    if (!account.isReady) {
      navigate('/dashboard/login');
    }
  }, [account.isReady, navigate]);

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

  const handleTraitNameChange = (val) => {
    const newArr = layerData.filter((elem) =>
      elem.id === currentLayer ? (elem.traitName = val) : elem
    );
    setLayerData(newArr);
  };

  const handleAddMultiImage = (files) => {
    const newArr = layerData.filter((elem) => {
      if (elem.id === currentLayer) {
        Object.entries(files).forEach(([key, value]) => {
          elem.imagArr.push({
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

  const handleDeleteLayer = (currentLayer) => {
    const newArr = layerData.filter((elem) => elem.id !== currentLayer);
    setLayerData(newArr);
  };

  const handleImageUpdate = (val, type, index) => {
    const newArr = layerData.filter((elem) => {
      if (elem.id === currentLayer) {
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

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length !== 0) handleAddMultiImage(acceptedFiles);
    },
    [layerData]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <Page title="Create you new Nft">
      <Container>
        <Typography variant="h4" sx={{ mb: 5 }}>
          Create a new NFTs
        </Typography>
      </Container>
      <Container>
        <div>
          <Input placeholder="Collection Name" />
        </div>
        <div>
          <Input placeholder="Collection Description" />
        </div>
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
                  onChange={(e) => handleTraitNameChange(e.target.value)}
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
                <Button variant="contained" component="label" onClick={handleDeleteLayer}>
                  Delete Layer
                </Button>
              </Stack>
              <div
                {...getRootProps({ className: 'dropzone' })}
                style={{ width: '100%', paddingLeft: 25 }}
              >
                <input {...getInputProps()} />
                <Stack direction="row" alignItems="center" sx={{ marginTop: 2 }}>
                  {data.imagArr.length ? (
                    data.imagArr.map((file, index) => (
                      <Card
                        key={file}
                        variant="outlined"
                        sx={{
                          maxWidth: 200,
                          maxHeight: 150,
                          padding: 1,
                          marginRight: 2,
                          zIndex: 999
                        }}
                      >
                        <Input
                          placeholder="Trait Value"
                          value={file.traitVal}
                          onChange={(e) => handleImageUpdate(e.target.value, 'name', index)}
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
                          onChange={(e) => handleImageUpdate(e.target.value, 'rarity', index)}
                        />
                      </Card>
                    ))
                  ) : (
                    <p>Drag 'n' drop some files here, or click to select files</p>
                  )}
                </Stack>
              </div>
            </Stack>
          ))}
        <Button onClick={handleAddLayer}>Add another layer</Button>
      </Container>
    </Page>
  );
}
