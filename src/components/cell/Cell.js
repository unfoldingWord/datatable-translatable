import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import isEqual from 'lodash.isequal';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';

import { BlockEditable } from 'markdown-translatable';
import useStyles from './styles';

// file to memory
const inputFilters = [
  [/<br>/gi, '\n'],
  [/^\u200B/,''], [/\u200B$/,''],
  ['\\n\\n> ', '\n\n> '],
];

// screen to memory and thus to file
const outputFilters = [
  [/^\u200B/,''], [/\u200B$/,''],
  [/<br>/gi, '\n'],
  ['\n\n> ', '\\n\\n> '],
];

function BlockEditableWrapper({
  columnData,
  original,
  translation,
  rowIndex,
  columnIndex,
  preview,
  handleEdit,
  dataTestId,
  columnsFilterOptions,
}) {
  const classes = useStyles();
  const subheading = (
    <Typography className={classes.subheading} variant='subtitle2' align='left' color='textSecondary'>
      {columnData.name}
    </Typography>
  );
  const originalValue = original || '*empty*';
  const translationValue = translation || '\u00A0';

  return (
    <div className={classes.row}>
      <div className={classes.original}>
        <div className={columnData.name === 'OccurrenceNote' ? classes.divOccurrence : classes.divRow}>
          <>
            <div className={classes.divSubheading}>
              {subheading}
            </div>
            <div className="editableWrapper">
              <BlockEditable
                key={`${rowIndex}-${columnIndex}-original`}
                preview={preview}
                markdown={originalValue}
                editable={false}
                inputFilters={inputFilters}
                outputFilters={outputFilters}
              />
            </div>
          </>
        </div>
      </div>
      <div className={classes.translation}>
        <div className={columnData.name === 'OccurrenceNote' ? classes.divOccurrence : classes.divRow}>
          <>
            <div data-test={'id_'+dataTestId+'_'+columnData.name+'_label'} className={classes.divSubheading}>
              {subheading}
            </div>
            <div data-test={'id_'+dataTestId+'_'+columnData.name+'_content'} className="editableWrapper">
              { columnsFilterOptions && columnsFilterOptions[columnIndex-1] && columnsFilterOptions[columnIndex-1].length > 0 ?
                <Autocomplete
                  value={translationValue}
                  options={columnsFilterOptions[columnIndex-1]}
                  freeSolo
                  onChange={(event, newValue) => {
                    if (typeof newValue === 'string' ) {
                      handleEdit(newValue);
                    }
                  }}
                  handleHomeEndKeys
                  renderInput={(params) => <TextField {...params} onBlur={(event) => {
                    if ( event ) {
                      handleEdit(event.target.value);
                    }
                  } }
                  />
                  }
                />
                :
                <BlockEditable
                  key={`${rowIndex}-${columnIndex}-target`}
                  debounce={1000}
                  preview={preview}
                  markdown={translationValue}
                  editable={true}
                  inputFilters={inputFilters}
                  outputFilters={outputFilters}
                  onEdit={handleEdit}
                />
              }
            </div>
          </>
        </div>
      </div>
    </div>
  );
}

function Cell(props) {
  const {
    value,
    tableMeta: {
      columnData,
      columnIndex,
      rowIndex,
      rowData,
    },
    preview,
    onEdit,
    delimiters,
    columnsFilterOptions,
    generateRowId = () => {},
  } = props;
  const classes = useStyles();
  const [original, translation] = value.split(delimiters.cell);

  function handleEdit(markdown){
    const _markdown = markdown.replace(/^\u00A0/,'');

    onEdit({
      rowIndex, columnIndex: columnIndex - 1, value: _markdown,
    });
  }

  return (
    <div className={`cell-${rowIndex}-${columnIndex} ` + classes.root}>
      <BlockEditableWrapper
        columnData={columnData}
        original={original}
        translation={translation}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        preview={preview}
        handleEdit={handleEdit}
        dataTestId = {generateRowId(rowData)}
        columnsFilterOptions={columnsFilterOptions}
      />
    </div>
  );
}

Cell.propTypes = {
  /** Value of the cell */
  value: PropTypes.string.isRequired,
  /** The tableMeta passed from MUIDataTables */
  tableMeta: PropTypes.object.isRequired,
  /** The function to render the rowHeader */
  rowHeader: PropTypes.func,
  /** Set html preview mode, false renders raw markdown */
  preview: PropTypes.bool,
  /** The delimiters for converting the file into rows/columns */
  delimiters: PropTypes.shape({
    /** Delimiters to convert a files into rows "\n" */
    row: PropTypes.string.isRequired,
    /** Delimiters to convert a row into cells "\t" */
    cell: PropTypes.string.isRequired,
  }).isRequired,
  /** Handle database updates */
  onEdit: PropTypes.func.isRequired,
};

Cell.defaultProps = {
  delimiters: {
    row: '\n',
    cell: '\t',
  },
};


const shouldReRender = (prevProps, nextProps) =>
  isEqual(prevProps.tableMeta, nextProps.tableMeta) &&
  isEqual(prevProps.preview, nextProps.preview) &&
  isEqual(prevProps.value, nextProps.value) &&
  isEqual(prevProps.page, nextProps.page);

export default memo(Cell, shouldReRender);
