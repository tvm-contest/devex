import { Icon } from '@iconify/react';
import pieChart2Fill from '@iconify/icons-eva/pie-chart-2-fill';
import peopleFill from '@iconify/icons-eva/people-fill';
import fileTextFill from '@iconify/icons-eva/file-text-fill';
import imageFill from '@iconify/icons-eva/image-2-fill';
import buldFill from '@iconify/icons-eva/bulb-fill';

// ----------------------------------------------------------------------

const getIcon = (name) => <Icon icon={name} width={22} height={22} />;

const sidebarConfig = [
  {
    title: 'dashboard',
    path: '/dashboard/app',
    icon: getIcon(pieChart2Fill)
  },
  {
    title: 'user',
    path: '/dashboard/user',
    icon: getIcon(peopleFill)
  },
  {
    title: 'NFTs',
    path: '/dashboard/nfts',
    icon: getIcon(imageFill)
  },
  {
    title: 'New NFT',
    path: '/dashboard/create',
    icon: getIcon(buldFill)
  },
  {
    title: 'blog',
    path: '/dashboard/blog',
    icon: getIcon(fileTextFill)
  }
];

export default sidebarConfig;
