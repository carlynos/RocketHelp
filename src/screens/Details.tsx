import { useState, useEffect } from 'react';

import firestore from '@react-native-firebase/firestore';
import { CircleWavyCheck, Hourglass, DesktopTower, Clipboard, ClipboardText } from 'phosphor-react-native';

import { useNavigation, useRoute } from '@react-navigation/native';


import { Text, VStack, HStack, useTheme, ScrollView, Box } from 'native-base';
import { Header } from '../components/Header';
import { OrderProps } from '../components/Order';
import { OrderFirestoreDTO } from '../DTOs/OrderFirestoreDTO';
import { dateFormat } from '../utils/fireStoreDateFormate';
import { Loading } from '../components/Loading';
import { color } from 'native-base/lib/typescript/theme/styled-system';

import { CardDetails } from '../components/CardDetails';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from 'react-native';


type RouteParams = {
  orderId: string;
}

type OrderDetails = OrderProps & {
  description: string;
  solution: string;
  closed: string;
}

export function Details() {
  const [isLoading, setIsLoading] = useState(true);
  const [solution, setSolution] = useState('');
  const [order, setOrder] = useState<OrderDetails>({} as OrderDetails);

  const { colors } = useTheme();

  const route = useRoute();
  const { orderId } = route.params as RouteParams;

  const navigation = useNavigation();

  function handleOrderClose(){
    if(!solution){
      Alert.alert('Solicitação', 'Informe a solução para encerrar a solicitação');
    }

    firestore()
    .collection<OrderFirestoreDTO>('orders')
    .doc(orderId)
    .update({
      status: 'closed',
      solution,
      closed_at: firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      Alert.alert('Solicitação', 'Solicitação encerrada.')
      navigation.goBack();
    })
    .catch((error) => {
      console.log(error);
      Alert.alert('Solicitação', 'Não foi possivel encerrar a solicitação.')
    })
  }

  useEffect(() => {
    setIsLoading(false);

    firestore()
    .collection<OrderFirestoreDTO>('orders')
    .doc(orderId)
    .get()
    .then((doc) => {
      const { patrimony, description, status, created_at, closed_at, solution } = doc.data();

      const closed = closed_at ? dateFormat(closed_at) : null;

      setOrder({
        id: doc.id,
        patrimony,
        description,
        status,
        solution,
        when: dateFormat(created_at),
        closed
      });

      setIsLoading(false);

    })
  }, []);

  if(isLoading){
    return <Loading />
  }


  return (
    <VStack flex={1} bg="gray.700">
        <Box px={6} bg="gray.600">
          <Header title="Solicitação" />  
        </Box>
        <HStack bg="gray.500" justifyContent="center" p={4}>
          {order.status === 'closed' ? <CircleWavyCheck size={22} color={colors.green[300]} /> : <Hourglass size={22} color={colors.secondary[700]} />}

          <Text
          fontSize="sm"
          color={order.status === 'closed' ? colors.green[300] : colors.secondary[700]}
          ml={2}
          textTransform="uppercase"
          >
            {order.status === 'closed' ? 'Finalizado' : 'Em Andamento'}
          </Text>
        </HStack>

        <ScrollView mx={5} showsVerticalScrollIndicator={false}>
            <CardDetails
              title="Equipamento"
              description={`Patrimônio ${order.patrimony}`}
              icon={DesktopTower}
            />

            <CardDetails
              title="Descrição do problema"
              description={order.description}
              icon={ClipboardText}
              footer={order.when}

            />

            <CardDetails
              title="Solução"
              icon={CircleWavyCheck}
              description={order.closed && order.solution}
              footer={order.closed && `Encerrado em ${order.closed}`}
            >
              {
                order.status == 'open' && <Input bg="gray.600" placeholder="Descrição da Solução" onChangeText={setSolution} h={24} textAlignVertical="top" multiline />}
            </CardDetails>

            

        </ScrollView>

        {order.status === 'open' && <Button title="Salvar alterações" m={5} onPress={handleOrderClose} isLoading={isLoading} />}

    </VStack>
  );
}