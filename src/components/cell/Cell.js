import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import isEqual from 'lodash.isequal';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';

import { BlockEditable, MarkdownContext } from 'markdown-translatable';
import useStyles from './styles';
import { DataTableContext } from '../datatable/DataTable.context';

// file to memory
const inputFilters = [
  [/<br>/gi, '\n'],
  [/^\u200B/,''], [/\u200B$/,''],
  ['\\n\\n> ', '\n\n> '],
];

// screen to memory and thus to file
const outputFilters = [
  [/^\u200B/,''], [/\u200B$/,''],
  [/^\u00A0/,''], [/\u00A0$/,''],
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
  originalFontFamily,
  translationFontFamily,
}) {
  const classes = useStyles({ originalFontFamily, translationFontFamily });
  const subheading = (
    <Typography className={classes.subheading} variant='subtitle2' align='left' color='textSecondary'>
      {columnData.name}
    </Typography>
  );
  const originalValue = original || '*empty*';
  const { actions } = useContext(MarkdownContext);

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
                  value={translation}
                  options={columnsFilterOptions[columnIndex-1]}
                  freeSolo
                  onChange={(event, newValue) => {
                    if (typeof newValue === 'string' ) {
                      handleEdit(newValue);

                      if (actions && actions.setIsChanged) {
                        actions.setIsChanged(true);
                      }
                    }
                  }}
                  handleHomeEndKeys
                  renderInput={(params) => <TextField {...params} onBlur={(event) => {
                    if ( event ) {
                      handleEdit(event.target.value);

                      if (actions && actions.setIsChanged) {
                        actions.setIsChanged(true);
                      }
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
                  markdown={translation || '\u00A0'}
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
    originalFontFamily,
    translationFontFamily,
  } = props;

  const classes = useStyles();
  const [original, translation] = value.split(delimiters.cell);

  const { state: { isChanged } } = useContext(MarkdownContext);

  const savedTranslation = useRef(null);

  useEffect(() => {
    savedTranslation.current = translation;
  }, []);

  useEffect(() => {
    if (!isChanged) {
      savedTranslation.current = translation;
    }
  }, [isChanged, translation]);


  function handleEdit(markdown){
    const _markdown = markdown.replace(/^\u00A0/, '');



    if (savedTranslation.current !== _markdown) {
      onEdit({
        rowIndex, columnIndex: columnIndex - 1, value: _markdown, savedTranslation: savedTranslation.current,
      });
    }
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
        originalFontFamily={originalFontFamily}
        translationFontFamily={translationFontFamily}
      />
    </div>
  );
}

Cell.propTypes = {
  /** Value of the cell */
  value: PropTypes.string.isRequired,
  /** The tableMeta passed from MUIDataTables */
  tableMeta: PropTypes.object.isRequired,
  /** Set html preview mode, false renders raw markdown */
  rowHeader: PropTypes.func,
  /** The function to render the rowHeader */
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
