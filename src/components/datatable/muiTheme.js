import { createMuiTheme } from '@material-ui/core/styles';
import lightBlue from '@material-ui/core/colors/lightBlue';

export const getMuiTheme = createMuiTheme({
  palette: {
    background: {
      pulsing: lightBlue[50],
    },
  },
  typography: { useNextVariants: true },
  overrides: {
    MuiIconButton: { root: { padding: '8px' } },
    MuiTableCell: {
      root: {
        'padding': '0',
        'textAlign': 'unset',
        'display': 'block',
        'borderBottom': 'none',
        '&:last-child': { paddingRight: 0 },
        // '&:first-child': { top:'0 !important' },
        '&:nth-child(1)': {
          position: 'sticky',
          zIndex: 15,
          top: '48px',
          background: 'white',
        },
      },
      body: { fontSize: '1em' },
    },
    MuiTableRow: {
      root: {
        height: 'unset',
        padding: '0',
        display: 'block',
      },
    },
    MUIDataTable: {
      root: {},
      responsiveScroll: {
        maxHeight: 'unset',
        overflowX: 'unset',
        overflowY: 'unset',
      },
      paper: { boxShadow: '0px' },
    },
    MuiToolbar: {
      root: {
        top: 0,
        overflow: 'visible',
        position: 'sticky',
        background: 'white',
        zIndex: '100',
        minHeight: '48px !important',
        height: '48px !important',
      },
    },
    MUIDataTableHeadRow: { root: { display: 'none' } },
    MuiTable: {
      root: {
        position: 'sticky',
        bottom: 0,
        background: 'white',
      },
    },
    MuiGridListTile: { tile: { overflow: 'visible' } },
    MuiPopover: { paper: { overflowX: 'visible', overflowY: 'visible' } },
    MuiGridList: { root: { overflowY: 'visible' } },
    MuiTableFooter: { root: { borderTop: '1px solid #ccc' } },
    MuiAutocomplete: { popper: { top: '100%' } },
    MUIDataTableBodyCell: { root: { '&:focus-within:not(:nth-child(1))': { background: 'rgba(0,0,0,0.05)' } } },
    MUIDataTableBodyRow: {
      root: {
        '&:focus-within': {
          'boxShadow': 'grey 0px 0px 5px inset',
          'background': 'rgba(0,0,0,0.01)',
          'border': '3px solid #31ade3',
          '& .header-row': { background: 'rgba(0,0,0,0.05) !important' },
        },
      },
    },
  },
});