import {assert} from '../utils/assert';
import postcss from 'postcss';
import {
  postcssAstDependencies, getDependencyIdentifierFromImportRule, getDependencyIdentifiersFromDeclarationValue
} from '../postcss-ast-dependencies';

describe('postcss-ast-dependencies', () => {
  describe('#postcssAstDependencies', () => {
    it('should find multiple import identifiers', () => {
      // Test data sourced from https://developer.mozilla.org/en/docs/Web/CSS/@import#Examples

      const ast = postcss.parse(`
        @import url("fineprint.css") print;
        @import url("bluish.css") projection, tv;
        @import 'custom.css';
        @import url("chrome://communicator/skin/");
        @import "common.css" screen, projection;
        @import url('landscape.css') screen and (orientation:landscape);
      `);

      assert.deepEqual(
        postcssAstDependencies(ast)
        [
          {source: 'fineprint.css'},
          {source: 'bluish.css'},
          {source: 'custom.css'},
          {source: 'chrome://communicator/skin/'},
          {source: 'common.css'},
          {source: 'landscape.css'}
        ]
      );
    });
    it('should not find commented out import identifiers', () => {
      // Test data sourced from https://developer.mozilla.org/en/docs/Web/CSS/@import#Examples

      const ast = postcss.parse(`
        /* @import url("foo.css"); */
        @import url("bar.css");
        /*@import url("foo.css");*/
      `);

      assert.deepEqual(
        postcssAstDependencies(ast)
        [{source: 'bar.css'}]
      );
    });
    it('should extract multiple url identifiers', () => {
      const ast = postcss.parse(`
        .foo {
          background-image: url('./foo.png');
        }
        .bar {
          background-image: url('./bar.png');
        }
      `);

      assert.deepEqual(
        postcssAstDependencies(ast)
        [
          {source: './foo.png'},
          {source: './bar.png'}
        ]
      );
    });
    it('should not find commented out url identifiers', () => {
      // Test data sourced from https://developer.mozilla.org/en/docs/Web/CSS/@import#Examples

      const ast = postcss.parse(`
        .foo {
          /*background-image: url('./foo.png');*/
        }
        /*
        .bar {
          background-image: url('./foo.png');
        }
        */
      `);

      assert.deepEqual(postcssAstDependencies(ast), []);
    });
  });
  describe('#getDependencyIdentifiersFromDeclarationValue', () => {
    it('should find `url(...)` identifiers from strings', () => {
      assert.deepEqual(
        getDependencyIdentifiersFromDeclarationValue(''),
        []
      );

      assert.deepEqual(
        getDependencyIdentifiersFromDeclarationValue(`
          color: red;
        `),
        []
      );

      assert.deepEqual(
        getDependencyIdentifiersFromDeclarationValue(`
          background-image: url('./foo.png');
        `),
        ['./foo.png']
      );

      // Not sure if there are any rules that allow multiple
      // urls, but better safe than sorry
      assert.deepEqual(
        getDependencyIdentifiersFromDeclarationValue(`
          background-image:
            url('./foo.png') url('./bar.png');
        `),
        ['./foo.png', './bar.png']
      );
    });
    it('should not find commented out urls', () => {
      assert.deepEqual(
        getDependencyIdentifiersFromDeclarationValue(
          '/*background-image: url("./woz.jpg");*/'
        ),
        []
      );
      assert.deepEqual(
        getDependencyIdentifiersFromDeclarationValue(
          '/* background-image: url("./bar.jpg"); */'
        ),
        []
      );
      assert.deepEqual(
        getDependencyIdentifiersFromDeclarationValue(
          '  /*background-image: url("./foo.jpg");*/'
        ),
        []
      );
    });
  });
  describe('#getDependencyIdentifierFromImportRule', () => {
    it('should correctly extract identifiers', () => {
      // Test data sourced from https://developer.mozilla.org/en/docs/Web/CSS/@import#Examples

      let rule = postcss.parse('@import url("fineprint.css") print;').first;
      let identifier = getDependencyIdentifierFromImportRule(rule);
      assert.equal(identifier, 'fineprint.css');

      rule = postcss.parse('@import url("bluish.css") projection, tv;').first;
      identifier = getDependencyIdentifierFromImportRule(rule);
      assert.equal(identifier, 'bluish.css');

      rule = postcss.parse('@import "custom.css";').first;
      identifier = getDependencyIdentifierFromImportRule(rule);
      assert.equal(identifier, 'custom.css');

      rule = postcss.parse('@import url("chrome://communicator/skin/");').first;
      identifier = getDependencyIdentifierFromImportRule(rule);
      assert.equal(identifier, 'chrome://communicator/skin/');

      rule = postcss.parse('@import "common.css" screen, projection;').first;
      identifier = getDependencyIdentifierFromImportRule(rule);
      assert.equal(identifier, 'common.css');

      rule = postcss.parse('@import url(\'landscape.css\') screen and (orientation:landscape);').first;
      identifier = getDependencyIdentifierFromImportRule(rule);
      assert.equal(identifier, 'landscape.css');
    });
    it('should throw if the import is missing quotation marks', () => {
      let rule = postcss.parse('@import url(test.css);').first;
      assert.throws(
        () => getDependencyIdentifierFromImportRule(rule),
        'Malformed @import cannot resolve identifier'
      );

      rule = postcss.parse('@import test.css;').first;
      assert.throws(
        () => getDependencyIdentifierFromImportRule(rule),
        'Malformed @import cannot resolve identifier'
      );
    });
    it('should throw if the import is empty', () => {
      let rule = postcss.parse('@import url();').first;
      assert.throws(
        () => getDependencyIdentifierFromImportRule(rule),
        'Malformed @import cannot resolve identifier'
      );

      rule = postcss.parse('@import "";').first;
      assert.throws(
        () => getDependencyIdentifierFromImportRule(rule),
        'Malformed @import cannot resolve identifier'
      );
    });
  });
});