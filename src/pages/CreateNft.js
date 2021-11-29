import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// material
import { Container, Typography, Button, Input, Stack } from '@mui/material';
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
        id: layerData.length + 1,
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
    const newArr = layerData.filter((elem) =>
      elem.id === currentLayer ? elem.imagArr.push(Object.values(files)) : elem
    );
    setLayerData(newArr);
  };

  const handleDeleteLayer = (currentLayer) => {
    const newArr = layerData.filter((elem) => elem.id !== currentLayer);
    setLayerData(newArr);
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      // Do something with the files
      if (acceptedFiles.length !== 0) handleAddMultiImage(acceptedFiles);
      console.log('filess', acceptedFiles);
    },
    [layerData]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  console.log(layerData);
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
        <Typography variant="h6">Layers</Typography>
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
                <Button variant="contained" component="label" style={{ position: 'relative' }}>
                  Upload File
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
              <div {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p>Drop the files here ...</p>
                ) : (
                  <p>Drag 'n' drop some files here, or click to select files</p>
                )}
                {data.imagArr.length &&
                  data.imagArr.map((file) => <img src={file} key={file} alt="hi" />)}
              </div>
            </Stack>
          ))}
        <Button onClick={handleAddLayer}>Add another layer</Button>
      </Container>
    </Page>
  );
}
