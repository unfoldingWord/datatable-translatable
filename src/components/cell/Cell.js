import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import isEqual from 'lodash.isequal';

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
}) {
  const classes = useStyles();
  const subheading = (
    <Typography className={classes.subheading} variant='subtitle2' align='left' color='textSecondary'>
      {columnData.name}
    </Typography>
  );
  const originalValue = original || '*empty*';
  const translationValue = translation || '';

  return (
    <div className={classes.row}>
      <div className={classes.original}>
        {subheading}
        <BlockEditable
          key={`${rowIndex}-${columnIndex}-original`}
          preview={preview}
          markdown={originalValue}
          editable={false}
          inputFilters={inputFilters}
          outputFilters={outputFilters}
        />
      </div>
      <div className={classes.translation}>
        {subheading}
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
    },
    preview,
    onEdit,
    delimiters,
  } = props;
  const classes = useStyles();
  const [original, translation] = value.split(delimiters.cell);

  function handleEdit(markdown){
    onEdit({
      rowIndex, columnIndex: columnIndex - 1, value: markdown,
    });
  };

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
      />
    </div>
  );
};

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
