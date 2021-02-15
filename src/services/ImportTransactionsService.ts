import {In, getCustomRepository, getRepository} from 'typeorm'
import csvParser from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';


interface CSVTransaction{
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filepath: string): Promise<Transaction[]> {
    
    const contactsReadStream = fs.createReadStream(filepath);

    const parsers = csvParser({
      from_line: 2
    });
    
    const parseCSV = contactsReadStream.pipe(parsers);
    
    const categories: string[] = [];
    const transactions: CSVTransaction[] = [];

    parseCSV.on('data', async (line) =>{
      const [title, type, value, category]  = line.map((cell: string)=>
        cell.trim()
      );

      if(!title || !type || !value) return;

      categories.push(category);
      transactions.push({
        title,
        type,
        value,
        category
      });

    })

    await new Promise(resolve => parseCSV.on('end', resolve));

    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories)
      }
    })

    const existentCategoriesTitle = existentCategories.map((category: Category)=> category.title);

    const addCategoriesTitle = categories
        .filter(category => !existentCategoriesTitle.includes(category))
        .filter((value, index, self)=> self.indexOf(value) === index);

     const newCategories = categoryRepository.create(
       addCategoriesTitle.map(title=> ({
       title
     })));

     await categoryRepository.save(newCategories);

     const finalCategories = [ ...newCategories, ...existentCategories];

     const createdTransactions = transactionRepository.create(
      transactions.map(transaction => (
        {
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category: finalCategories.find(category=> category.title === transaction.category)        
        }
      ))
     );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filepath);
        
    return createdTransactions;

  }
}

export default ImportTransactionsService;
