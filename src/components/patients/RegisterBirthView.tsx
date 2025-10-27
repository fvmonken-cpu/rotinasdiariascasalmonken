import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Baby } from 'lucide-react';
interface RegisterBirthViewProps {
    onSuccess: () => void;
}
const RegisterBirthView: React.FC<RegisterBirthViewProps> = ({ onSuccess })=>{
    return (<div className="space-y-6" data-spec-id="register-birth-view">
      <div className="flex items-center justify-between" data-spec-id="J9ueOyowLBfCxXo3">
        <div data-spec-id="aqgZGgIIabP3J2XV">
          <h1 className="text-2xl font-bold text-gray-900" data-spec-id="8WyIG6vpOkkyMCY4">Registrar Nascimento</h1>
          <p className="text-gray-600" data-spec-id="SrNBJtflGjbkdqv6">Registre o nascimento de uma paciente</p>
        </div>
      </div>

      <Card data-spec-id="3PQuLqenjDDfEqjM">
        <CardHeader data-spec-id="oUSdrLu1FiS2B6DL">
          <CardTitle className="flex items-center" data-spec-id="oIZCqevhFitwoHhf">
            <Baby className="mr-2 h-5 w-5" data-spec-id="Bf85leRuDjbJtmav"/>
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent data-spec-id="N5EGlafHFRQEMN3L">
          <p className="text-gray-600" data-spec-id="oIUOKGYzrJb3lB9Q">
            O formulário de registro de nascimento será implementado em breve.
            Aqui você poderá registrar o nascimento das pacientes.
          </p>
        </CardContent>
      </Card>
    </div>);
};
export default RegisterBirthView;
