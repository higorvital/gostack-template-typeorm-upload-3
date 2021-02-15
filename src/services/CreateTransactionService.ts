import {getCustomRepository, getRepository} from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';
import Category from '../models/Category';

interface TransactionDTO{
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {

  public async execute({title, value, type, category}:TransactionDTO): Promise<Transaction> {
    
    const transactionsRepository = getCustomRepository(TransactionsRepository)

    const {total} = await transactionsRepository.getBalance();

    if(type === "outcome" && total < value){
        throw new AppError("Saída de caixa maior que o caixa atual");
    }
    
    const categoryRepository = getRepository(Category);
        
    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category
      }
    });

    if(!transactionCategory){

      transactionCategory = categoryRepository.create({
        title: category
      })

      await categoryRepository.save(transactionCategory);
    }

    const transaction = transactionsRepository.create({title, value, type, category: transactionCategory});
    // const transaction = transactionsRepository.create({title, value, type});
    
    await transactionsRepository.save(transaction);
    
    return transaction;
    
  }
}

export default CreateTransactionService;
