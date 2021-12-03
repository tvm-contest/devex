import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// material
import { Container, Typography, Button, Input, Stack, Card, CardMedia, Box } from '@mui/material';
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
  const [over, setOver] = useState([]);
  const {
    state: { account }
  } = useContext(StoreContext);

  const { getRootProps, getInputProps, acceptedFiles, fileRejections } = useDropzone();

  useEffect(() => {
    if (!account.isReady) {
      navigate('/dashboard/login');
    }
  }, [account.isReady, navigate]);

  console.log(fileRejections);

  const handleAddMultiImage = (files) => {
    const newArr = layerData.filter((elem) => {
      if (elem.id === currentLayer) {
        Object.entries(files).forEach(([key, value]) => {
          // console.log(key);
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

  useEffect(() => {
    handleAddMultiImage(acceptedFiles);
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
                  onChange={(e) => handleTraitNameChange(e.target.value, data.id)}
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
      </Container>
    </Page>
  );
}
